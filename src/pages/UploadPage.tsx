import { useState, useCallback, useEffect } from 'react';
import {
  Upload as UploadIcon,
  FileText,
  Loader,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import {
  extractText,
  getMedicalDocumentMimeType,
  isSupportedMedicalDocument,
} from '@/lib/ocrEngine';
import { analyzeMedicalText } from '@/lib/medicalAnalyzer';
import { Disclaimer } from '@/components/Disclaimer';
import { AnalysisResult } from '@/lib/medicalAnalyzer';

type UploadStatus = 'idle' | 'uploading' | 'ocr' | 'analyzing' | 'saving' | 'done' | 'error';

export function UploadPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!isSupportedMedicalDocument(selectedFile)) {
      setError('Unsupported file format. Please use PDF, PNG, JPG, BMP, TIFF, or WebP.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setResult(null);
    setStatus('idle');

    const isPDF = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    setPreviewUrl(isPDF ? null : URL.createObjectURL(selectedFile));
  }, []);

  const processFile = async () => {
    if (!file || !user) return;

    setStatus('uploading');
    setError(null);
    setProgress(0);
    let documentId: string | null = null;
    let uploadedFilePath: string | null = null;

    try {
      // Step 1: Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      uploadedFilePath = filePath;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          contentType: getMedicalDocumentMimeType(file),
        });

      if (uploadError) {
        throw new Error(
          `Storage upload failed: ${uploadError.message}. Verify the Supabase documents bucket, storage policies, and latest migrations.`
        );
      }

      // Step 2: Create document record
      const documentInsert = {
        user_id: user.id,
        file_name: file.name,
        file_type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
        status: 'processing',
      };
      let { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({ ...documentInsert, storage_path: filePath })
        .select()
        .single();

      if (
        docError?.message.includes('storage_path') &&
        docError.message.toLowerCase().includes('schema cache')
      ) {
        const retry = await supabase
          .from('documents')
          .insert(documentInsert)
          .select()
          .single();
        docData = retry.data;
        docError = retry.error;
      }

      if (docError) {
        throw new Error(`Failed to create document record: ${docError.message}`);
      }
      documentId = docData.id;

      // Step 3: OCR extraction
      setStatus('ocr');
      const ocrText = await extractText(file, (p) => setProgress(p));

      if (!ocrText || ocrText.trim().length < 5) {
        // Update document as failed
        const { error: updateError } = await supabase.from('documents')
          .update({ status: 'failed' })
          .eq('id', docData.id)
          .eq('user_id', user.id);
        if (updateError) throw new Error(`OCR failed and document status could not be updated: ${updateError.message}`);
        throw new Error(
          'OCR could not extract any readable text from this document. Please try a clearer image.'
        );
      }

      // Update document with OCR text
      const { error: ocrSaveError } = await supabase
        .from('documents')
        .update({ ocr_text: ocrText })
        .eq('id', docData.id)
        .eq('user_id', user.id);
      if (ocrSaveError) throw new Error(`Failed to save extracted text: ${ocrSaveError.message}`);

      // Step 4: Analyze extracted text
      setStatus('analyzing');
      const analysis = analyzeMedicalText(ocrText);
      setResult(analysis);

      // Step 5: Save extracted data to database
      setStatus('saving');

      const { error: saveError } = await supabase.rpc('complete_document_analysis', {
        p_document_id: docData.id,
        p_document_type: analysis.document_type,
        p_medications: analysis.medications,
        p_records: analysis.records,
        p_summary: {
          summary_english: analysis.summary_english,
          summary_telugu: analysis.summary_telugu,
          abnormal_findings: analysis.abnormal_findings,
          key_findings: analysis.key_findings,
          recommendations: analysis.recommendations,
        },
        p_timeline_title: `Document uploaded: ${file.name}`,
        p_timeline_description: `OCR processed document. Type: ${analysis.document_type}. ${analysis.medications.length} medications, ${analysis.records.length} test results found.`,
      });
      if (
        saveError &&
        (saveError.code === 'PGRST202' ||
          (saveError.message.includes('complete_document_analysis') &&
            saveError.message.toLowerCase().includes('schema cache')))
      ) {
        if (analysis.medications.length > 0) {
          const { error: medicationError } = await supabase.from('medications').insert(
            analysis.medications.map((medication) => ({
              user_id: user.id,
              name: medication.name,
              dosage: medication.dosage,
              frequency: medication.frequency,
              prescribed_for: medication.prescribed_for,
              status: 'active',
            }))
          );
          if (medicationError) {
            throw new Error(`Failed to save medications: ${medicationError.message}`);
          }
        }

        if (analysis.records.length > 0) {
          const { error: recordsError } = await supabase.from('medical_records').insert(
            analysis.records.map((record) => ({
              user_id: user.id,
              document_id: docData.id,
              record_type: record.record_type,
              fhir_resource_type: record.fhir_resource_type,
              code: record.code,
              display_name: record.display_name,
              value: record.value,
              unit: record.unit,
              reference_range: record.reference_range,
              status: record.status,
              is_abnormal: record.is_abnormal,
              notes: record.notes,
            }))
          );
          if (recordsError) {
            throw new Error(`Failed to save medical records: ${recordsError.message}`);
          }
        }

        const { error: summaryError } = await supabase.from('health_summaries').insert({
          user_id: user.id,
          document_id: docData.id,
          summary_english: analysis.summary_english,
          summary_telugu: analysis.summary_telugu,
          abnormal_findings: analysis.abnormal_findings,
          key_findings: analysis.key_findings,
          recommendations: analysis.recommendations,
        });
        if (summaryError) {
          throw new Error(`Failed to save health summary: ${summaryError.message}`);
        }

        const { error: timelineError } = await supabase.from('timeline_events').insert({
          user_id: user.id,
          event_type: analysis.document_type === 'prescription' ? 'prescription' : 'test',
          title: `Document uploaded: ${file.name}`,
          description: `OCR processed document. Type: ${analysis.document_type}. ${analysis.medications.length} medications, ${analysis.records.length} test results found.`,
        });
        if (timelineError) {
          throw new Error(`Failed to save timeline event: ${timelineError.message}`);
        }

        const { error: completeError } = await supabase
          .from('documents')
          .update({ document_type: analysis.document_type, status: 'completed' })
          .eq('id', docData.id)
          .eq('user_id', user.id);
        if (completeError) {
          throw new Error(`Failed to complete document: ${completeError.message}`);
        }
      } else if (saveError) {
        throw new Error(`Failed to save report analysis: ${saveError.message}`);
      }

      setStatus('done');
    } catch (err) {
      let message = err instanceof Error ? err.message : 'An unexpected error occurred during processing.';
      if (documentId) {
        const { error: statusError } = await supabase
          .from('documents')
          .update({ status: 'failed' })
          .eq('id', documentId)
          .eq('user_id', user.id);
        if (statusError) message += ` Also failed to mark the document as failed: ${statusError.message}`;
      } else if (uploadedFilePath) {
        const { error: cleanupError } = await supabase.storage
          .from('documents')
          .remove([uploadedFilePath]);
        if (cleanupError) message += ` Also failed to clean up the uploaded file: ${cleanupError.message}`;
      }
      setError(message);
      setStatus('error');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
    setPreviewUrl(null);
  };

  const statusMessages: Record<UploadStatus, string> = {
    idle: t.statusIdle,
    uploading: t.statusUploading,
    ocr: `${t.statusOcr} ${Math.round(progress * 100)}%`,
    analyzing: t.statusAnalyzing,
    saving: t.statusSaving,
    done: t.statusDone,
    error: t.statusError,
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.uploadMedicalDocument}</h2>
        <p className="text-muted mb-0">
          {t.uploadSubtitle}
        </p>
      </div>

      <div className="mb-3">
        <Disclaimer variant="compact" />
      </div>

      {status !== 'done' && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div
              className="border border-2 border-dashed rounded-3 p-5 text-center"
              style={{ borderColor: file ? '#2d6a4f' : '#ced4da', cursor: 'pointer' }}
              onClick={() => document.getElementById('file-input')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files[0]);
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.bmp,.tif,.tiff,.webp,application/pdf,image/png,image/jpeg,image/bmp,image/tiff,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />

              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="img-fluid rounded" style={{ maxHeight: '300px' }} />
              ) : file ? (
                <div className="d-flex align-items-center justify-content-center gap-2 text-success">
                  <FileText size={32} />
                  <span className="fw-semibold">{file.name}</span>
                </div>
              ) : (
                <>
                  <UploadIcon size={40} color="#6c757d" className="mb-2" />
                  <p className="mb-1 fw-semibold">{t.clickToUpload}</p>
                  <small className="text-muted">{t.fileTypes}</small>
                </>
              )}
            </div>

            {file && (
              <div className="mt-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </small>
                <button className="btn btn-sm btn-outline-danger" onClick={reset}>
                  {t.remove}
                </button>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3 py-2 small" role="alert">
                <XCircle size={16} className="me-2" />
                {error}
              </div>
            )}

            {(status === 'uploading' || status === 'ocr' || status === 'analyzing' || status === 'saving') && (
              <div className="mt-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Loader size={20} className="spin text-success" />
                  <span className="small fw-semibold">{statusMessages[status]}</span>
                </div>
                {status === 'ocr' && (
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {file && status === 'idle' && (
              <button className="btn btn-success w-100 mt-3" onClick={processFile}>
                <Sparkles size={18} className="me-2" />
                {t.processDocument}
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <div>
          <div className="alert alert-success d-flex align-items-center gap-2">
            <CheckCircle size={24} />
            <div>
              <strong>{t.documentProcessed}</strong>
              <div className="small">
                {t.extractedCount} {result.medications.length} {t.medicationsFound}, {result.records.length} test values,{' '}
                {result.diagnoses.length} diagnoses.
              </div>
            </div>
          </div>

          <div className="row g-3">
            {result.medications.length > 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.medicationsFound}</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>{t.medicine}</th>
                            <th>{t.dosage}</th>
                            <th>{t.frequency}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.medications.map((med: { name: string; dosage: string; frequency: string }, i: number) => (
                            <tr key={i}>
                              <td className="fw-semibold">{med.name}</td>
                              <td>{med.dosage || '—'}</td>
                              <td>{med.frequency || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.records.length > 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.testResults}</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>{t.test}</th>
                            <th>{t.value}</th>
                            <th>{t.referenceRange}</th>
                            <th>{t.status}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.records.map((rec: { display_name: string; value: string; unit: string; reference_range: string; is_abnormal: boolean }, i: number) => (
                            <tr key={i}>
                              <td className="fw-semibold">{rec.display_name}</td>
                              <td>{rec.value} {rec.unit}</td>
                              <td className="text-muted">{rec.reference_range}</td>
                              <td>
                                <span className={`badge ${rec.is_abnormal ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                                  {rec.is_abnormal ? t.abnormal : t.normal}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.aiHealthSummaryEn}</h5>
                  <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {result.summary_english}
                  </pre>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.aiHealthSummaryTe}</h5>
                  <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {result.summary_telugu}
                  </pre>
                </div>
              </div>
            </div>

            <div className="col-12">
              <button className="btn btn-success" onClick={reset}>
                {t.uploadAnother}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
