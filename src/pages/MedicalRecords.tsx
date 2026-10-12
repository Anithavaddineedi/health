import { useState, useEffect, useCallback } from 'react';
import { Activity, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { MedicalRecord } from '@/types';
import { useUserRealtime } from '@/hooks/useUserRealtime';

export function MedicalRecords() {
  const { user } = useAuth();
  const { t } = useLang();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'abnormal' | 'normal'>('all');
  const [errorMessage, setErrorMessage] = useState('');

  const loadRecords = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setErrorMessage(error.message);
    else setRecords(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useUserRealtime(user?.id, ['medical_records'], loadRecords, setErrorMessage);

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteRecordConfirm)) return;
    const { error } = await supabase.from('medical_records').delete().eq('id', id).eq('user_id', user?.id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setRecords(records.filter((r) => r.id !== id));
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.display_name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'abnormal' && r.is_abnormal) ||
      (filter === 'normal' && !r.is_abnormal);
    return matchesSearch && matchesFilter;
  });

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
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.recordsTitle}</h2>
        <p className="text-muted mb-0">{t.recordsSubtitle}</p>
      </div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <Search size={18} color="#6c757d" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t.searchTest}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'abnormal' | 'normal')}>
                <option value="all">{t.allRecords}</option>
                <option value="abnormal">{t.abnormalOnly}</option>
                <option value="normal">{t.normalOnly}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Activity size={40} className="mb-2 opacity-50" />
              <p className="mb-0">
                {records.length === 0
                  ? t.noRecordsYet
                  : t.noRecordsMatch}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>{t.fhirType}</th>
                    <th>{t.testName}</th>
                    <th>{t.value}</th>
                    <th>{t.referenceRange}</th>
                    <th>{t.status}</th>
                    <th>{t.date}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {rec.fhir_resource_type}
                        </span>
                      </td>
                      <td className="fw-semibold">{rec.display_name}</td>
                      <td>
                        {rec.value} {rec.unit}
                      </td>
                      <td className="text-muted small">{rec.reference_range}</td>
                      <td>
                        <span
                          className={`badge ${
                            rec.is_abnormal ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
                          }`}
                        >
                          {rec.is_abnormal ? t.abnormal : t.normal}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {rec.record_date ? new Date(rec.record_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-link text-danger p-1"
                          onClick={() => handleDelete(rec.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 small text-muted">
          {t.showingRecords} {filtered.length} of {records.length} {t.recordsTitle.toLowerCase()}
          {records.filter((r) => r.is_abnormal).length > 0 && (
            <span className="text-danger ms-2">
              ({records.filter((r) => r.is_abnormal).length} {t.abnormal.toLowerCase()})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
