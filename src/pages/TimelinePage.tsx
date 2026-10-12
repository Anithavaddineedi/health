import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { TimelineEvent } from '@/types';
import { useUserRealtime } from '@/hooks/useUserRealtime';

export function TimelinePage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    event_date: '',
    event_type: 'visit',
    title: '',
    description: '',
  });

  const eventTypeConfig: Record<string, { color: string; label: string }> = {
    visit: { color: '#2d6a4f', label: t.eventVisit },
    test: { color: '#40916c', label: t.eventTest },
    prescription: { color: '#52b788', label: t.eventPrescription },
    procedure: { color: '#1b4332', label: t.eventProcedure },
    diagnosis: { color: '#bc4749', label: t.eventDiagnosis },
  };

  const loadEvents = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false });
    if (error) setErrorMessage(error.message);
    else setEvents(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useUserRealtime(user?.id, ['timeline_events'], loadEvents, setErrorMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('timeline_events').insert({
      user_id: user.id,
      event_date: form.event_date,
      event_type: form.event_type,
      title: form.title,
      description: form.description,
    });
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setForm({ event_date: '', event_type: 'visit', title: '', description: '' });
    setShowForm(false);
    await loadEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteEventConfirm)) return;
    const { error } = await supabase.from('timeline_events').delete().eq('id', id).eq('user_id', user?.id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setEvents(events.filter((e) => e.id !== id));
  };

  // Group events by year/month
  const grouped = events.reduce((acc, event) => {
    const date = new Date(event.event_date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [aY, aM] = a.split('-').map(Number);
    const [bY, bM] = b.split('-').map(Number);
    return bY - aY || bM - aM;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.timelineTitle}</h2>
          <p className="text-muted mb-0">{t.timelineSubtitle}</p>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} /> {t.addEvent}
        </button>
      </div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.addTimelineEvent}</h5>
              <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">{t.date}</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">{t.eventType}</label>
                  <select
                    className="form-select"
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  >
                    <option value="visit">{t.eventVisit}</option>
                    <option value="test">{t.eventTest}</option>
                    <option value="prescription">{t.eventPrescription}</option>
                    <option value="procedure">{t.eventProcedure}</option>
                    <option value="diagnosis">{t.eventDiagnosis}</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">{t.title}</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Annual Checkup"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">{t.description}</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Details about this event..."
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-success">{t.addEvent}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <Calendar size={40} className="mb-2 opacity-50" />
            <p className="mb-2">{t.noTimelineEvents}</p>
            <button className="btn btn-success btn-sm" onClick={() => setShowForm(true)}>
              {t.addFirstEvent}
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {sortedKeys.map((key) => {
              const [year, month] = key.split('-').map(Number);
              return (
                <div key={key} className="mb-4">
                  <h6 className="fw-bold mb-3 text-muted">
                    {monthNames[month]} {year}
                  </h6>
                  <div className="timeline">
                    {grouped[key].map((event) => {
                      const config = eventTypeConfig[event.event_type] || eventTypeConfig.visit;
                      return (
                        <div key={event.id} className="timeline-item d-flex gap-3 pb-3 position-relative">
                          <div
                            className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: `${config.color}20`,
                              border: `2px solid ${config.color}`,
                            }}
                          >
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: config.color,
                              }}
                            />
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <span className="small text-muted me-2">
                                  {new Date(event.event_date).toLocaleDateString()}
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: `${config.color}20`,
                                    color: config.color,
                                  }}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <button
                                className="btn btn-sm btn-link text-danger p-0"
                                onClick={() => handleDelete(event.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="fw-semibold mt-1">{event.title}</div>
                            {event.description && (
                              <div className="small text-muted mt-1">{event.description}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 32px;
          bottom: 0;
          width: 2px;
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
