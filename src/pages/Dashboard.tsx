import { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  Pill,
  Calendar,
  Activity,
  Upload,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Disclaimer } from '@/components/Disclaimer';
import { Page } from '@/types';
import { useUserRealtime } from '@/hooks/useUserRealtime';

export function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState({
    documents: 0,
    medications: 0,
    records: 0,
    abnormalCount: 0,
    summaries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentDocs, setRecentDocs] = useState<Array<{ id: string; file_name: string; created_at: string; status: string }>>([]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    setErrorMessage('');
    const [docs, meds, records, summaries] = await Promise.all([
      supabase.from('documents').select('id, file_name, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('medications').select('id').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('medical_records').select('id, is_abnormal').eq('user_id', user.id),
      supabase.from('health_summaries').select('id').eq('user_id', user.id),
    ]);

    const failedQuery = [docs, meds, records, summaries].find((query) => query.error);
    if (failedQuery?.error) {
      setErrorMessage(failedQuery.error.message);
      setLoading(false);
      return;
    }

    setRecentDocs(docs.data?.slice(0, 5) || []);
    setStats({
      documents: docs.data?.length || 0,
      medications: meds.data?.length || 0,
      records: records.data?.length || 0,
      abnormalCount: records.data?.filter((r: { is_abnormal: boolean }) => r.is_abnormal).length || 0,
      summaries: summaries.data?.length || 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useUserRealtime(
    user?.id,
    ['documents', 'medications', 'medical_records', 'health_summaries'],
    loadStats,
    setErrorMessage
  );

  const statCards = [
    { label: t.documents, value: stats.documents, icon: FileText, color: '#2d6a4f', page: 'upload' as Page },
    { label: t.activeMedications, value: stats.medications, icon: Pill, color: '#40916c', page: 'medications' as Page },
    { label: t.medicalRecords, value: stats.records, icon: Activity, color: '#1b4332', page: 'records' as Page },
    { label: t.abnormalValues, value: stats.abnormalCount, icon: AlertCircle, color: '#bc4749', page: 'records' as Page },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.dashboardTitle}</h2>
        <p className="text-muted mb-0">{t.dashboardSubtitle}</p>
      </div>

      <div className="mb-4">
        <Disclaimer variant="compact" />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" />
        </div>
      ) : (
        <>
          {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
          <div className="row g-3 mb-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div className="col-6 col-lg-3" key={card.label}>
                  <div
                    className="card border-0 shadow-sm h-100"
                    role="button"
                    onClick={() => onNavigate(card.page)}
                    style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div className="card-body d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{ width: '48px', height: '48px', backgroundColor: `${card.color}15` }}
                      >
                        <Icon size={24} color={card.color} />
                      </div>
                      <div>
                        <h3 className="fw-bold mb-0" style={{ color: card.color }}>
                          {card.value}
                        </h3>
                        <small className="text-muted">{card.label}</small>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.recentDocuments}</h5>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => onNavigate('upload')}
                    >
                      <Upload size={16} className="me-1" /> {t.upload}
                    </button>
                  </div>

                  {recentDocs.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <FileText size={40} className="mb-2 opacity-50" />
                      <p className="mb-2">{t.noDocumentsYet}</p>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => onNavigate('upload')}
                      >
                        {t.uploadFirstDocument}
                      </button>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {recentDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="list-group-item px-0 d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex align-items-center gap-2">
                            <FileText size={20} color="#6c757d" />
                            <div>
                              <div className="small fw-semibold text-truncate" style={{ maxWidth: '300px' }}>
                                {doc.file_name}
                              </div>
                              <small className="text-muted">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                          <span
                            className={`badge ${
                              doc.status === 'completed'
                                ? 'bg-success-subtle text-success'
                                : doc.status === 'processing'
                                ? 'bg-warning-subtle text-warning'
                                : doc.status === 'failed'
                                ? 'bg-danger-subtle text-danger'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.quickActions}</h5>
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-success text-start" onClick={() => onNavigate('upload')}>
                      <Upload size={18} className="me-2" /> {t.uploadDocument}
                    </button>
                    <button className="btn btn-outline-success text-start" onClick={() => onNavigate('appointments')}>
                      <Calendar size={18} className="me-2" /> {t.bookDoctor}
                    </button>
                    <button className="btn btn-outline-success text-start" onClick={() => onNavigate('timeline')}>
                      <Calendar size={18} className="me-2" /> {t.viewTimeline}
                    </button>
                    <button className="btn btn-outline-success text-start" onClick={() => onNavigate('summaries')}>
                      <TrendingUp size={18} className="me-2" /> {t.aiSummaries}
                    </button>
                    <button className="btn btn-outline-success text-start" onClick={() => onNavigate('profile')}>
                      <Activity size={18} className="me-2" /> {t.updateProfile}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.summaryStats}</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">{t.summariesGenerated}</span>
                    <span className="fw-semibold">{stats.summaries}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">{t.totalRecords}</span>
                    <span className="fw-semibold">{stats.records}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">{t.abnormalFlags}</span>
                    <span className="fw-semibold text-danger">{stats.abnormalCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
