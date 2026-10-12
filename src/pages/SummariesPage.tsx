import { useState, useEffect, useCallback } from 'react';
import { Sparkles, FileText, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Disclaimer } from '@/components/Disclaimer';
import { HealthSummary } from '@/types';
import { useUserRealtime } from '@/hooks/useUserRealtime';

export function SummariesPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [summaries, setSummaries] = useState<HealthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HealthSummary | null>(null);
  const [language, setLanguage] = useState<'english' | 'telugu'>('english');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSummaries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('health_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    setSummaries(data || []);
    if (data && data.length > 0) {
      setSelected(data[0]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useUserRealtime(user?.id, ['health_summaries'], loadSummaries, setErrorMessage);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.summariesTitle}</h2>
        <p className="text-muted mb-0">{t.summariesSubtitle}</p>
      </div>

      <div className="mb-3">
        <Disclaimer variant="compact" />
      </div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      {summaries.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <Sparkles size={40} className="mb-2 opacity-50" />
            <p className="mb-0">{t.noSummariesYet}</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <div className="list-group list-group-flush">
                {summaries.map((summary) => (
                  <button
                    key={summary.id}
                    className={`list-group-item list-group-item-action text-start ${selected?.id === summary.id ? 'active' : ''}`}
                    style={{
                      backgroundColor: selected?.id === summary.id ? '#2d6a4f' : undefined,
                      color: selected?.id === summary.id ? 'white' : undefined,
                      borderColor: '#e0e0e0',
                    }}
                    onClick={() => setSelected(summary)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <FileText size={18} className="flex-shrink-0" />
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="small fw-semibold text-truncate">
                          {t.healthSummary} {new Date(summary.created_at).toLocaleDateString()}
                        </div>
                        <small className={selected?.id === summary.id ? 'text-white-50' : 'text-muted'}>
                          {new Date(summary.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            {selected && (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.healthSummary}</h5>
                    <div className="btn-group btn-group-sm">
                      <button
                        className={`btn ${language === 'english' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setLanguage('english')}
                      >
                        {t.english}
                      </button>
                      <button
                        className={`btn ${language === 'telugu' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setLanguage('telugu')}
                      >
                        {t.telugu}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <pre
                      className="small mb-0 p-3 rounded-3"
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        backgroundColor: '#f8f9fa',
                        color: '#212529',
                      }}
                    >
                      {language === 'english' ? selected.summary_english : selected.summary_telugu}
                    </pre>
                  </div>

                  {selected.abnormal_findings && selected.abnormal_findings.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2" style={{ color: '#bc4749' }}>
                        <AlertTriangle size={18} className="me-1" />
                        {t.abnormalFindings} ({selected.abnormal_findings.length})
                      </h6>
                      <div className="list-group">
                        {selected.abnormal_findings.map((finding, i) => (
                          <div key={i} className="list-group-item border-0 bg-light rounded-3 mb-2">
                            <div className="fw-semibold small">{finding.test_name}</div>
                            <div className="small text-muted">
                              Value: {finding.value} | Reference: {finding.reference_range}
                            </div>
                            <div className="small mt-1">{finding.explanation}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.key_findings && selected.key_findings.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2" style={{ color: '#1b4332' }}>{t.keyFindings}</h6>
                      <ul className="list-unstyled mb-0">
                        {selected.key_findings.map((finding, i) => (
                          <li key={i} className="small mb-1 d-flex gap-2">
                            <span style={{ color: '#2d6a4f' }}>•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.recommendations && selected.recommendations.length > 0 && (
                    <div>
                      <h6 className="fw-bold mb-2" style={{ color: '#1b4332' }}>
                        <Lightbulb size={18} className="me-1" />
                        {t.recommendations}
                      </h6>
                      <ul className="list-unstyled mb-0">
                        {selected.recommendations.map((rec, i) => (
                          <li key={i} className="small mb-1 d-flex gap-2">
                            <span style={{ color: '#2d6a4f' }}>•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
