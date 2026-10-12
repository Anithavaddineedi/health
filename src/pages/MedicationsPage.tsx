import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Pill, Plus, Trash2, Edit3, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Medication } from '@/types';
import { useUserRealtime } from '@/hooks/useUserRealtime';
import {
  notifyMedicationRemindersUpdated,
  readLocalMedicationReminders,
  saveLocalMedicationReminder,
} from '@/lib/localMedicationReminders';

interface MedicationReminder {
  id: string;
  medication_id: string;
  reminder_time: string;
  timezone: string;
  enabled: boolean;
}

function isMissingReminderTable(error: { code?: string; message: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message.includes('medication_reminders') &&
      error.message.toLowerCase().includes('schema cache'))
  );
}

export function MedicationsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Record<string, MedicationReminder>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    prescribed_for: '',
    status: 'active',
    notes: '',
  });

  const loadMedications = useCallback(async () => {
    if (!user) return;
    setErrorMessage('');
    const [medicationResult, reminderResult] = await Promise.all([
      supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('medication_reminders')
        .select('id, medication_id, reminder_time, timezone, enabled')
        .eq('user_id', user.id),
    ]);
    if (medicationResult.error) {
      setErrorMessage(medicationResult.error.message);
      setLoading(false);
      return;
    }
    if (reminderResult.error && !isMissingReminderTable(reminderResult.error)) {
      setErrorMessage(reminderResult.error.message);
      setLoading(false);
      return;
    }
    let localReminders: MedicationReminder[] = [];
    if (reminderResult.error) {
      try {
        localReminders = readLocalMedicationReminders(user.id);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to read reminders saved on this device.'
        );
        setLoading(false);
        return;
      }
    }
    setMedications(medicationResult.data || []);
    setReminders(Object.fromEntries(
      [...(reminderResult.data || []), ...localReminders].map((reminder) => [
        reminder.medication_id,
        reminder as MedicationReminder,
      ])
    ));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadMedications();
  }, [loadMedications]);

  useUserRealtime(user?.id, ['medications'], loadMedications, setErrorMessage);

  const resetForm = () => {
    setForm({
      name: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      prescribed_for: '',
      status: 'active',
      notes: '',
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      prescribed_for: form.prescribed_for,
      status: form.status,
      notes: form.notes,
    };

    if (editing) {
      const { error } = await supabase.from('medications').update(payload).eq('id', editing.id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('medications').insert({ ...payload, user_id: user.id });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    resetForm();
    void loadMedications();
  };

  const handleEdit = (med: Medication) => {
    setEditing(med);
    setForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.start_date || '',
      end_date: med.end_date || '',
      prescribed_for: med.prescribed_for,
      status: med.status,
      notes: med.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteMedConfirm)) return;
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleStatusChange = async (med: Medication, newStatus: string) => {
    const { error } = await supabase.from('medications').update({ status: newStatus }).eq('id', med.id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    void loadMedications();
  };

  const saveReminder = async (medicationId: string, time: string) => {
    if (!user) return;
    setErrorMessage('');
    if (!('Notification' in window)) {
      setErrorMessage('This browser does not support notifications.');
      return;
    }
    let notificationPermission = Notification.permission;
    if (Notification.permission === 'default') {
      try {
        notificationPermission = await Notification.requestPermission();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `Could not request notification permission: ${error.message}`
            : 'Could not request notification permission.'
        );
        return;
      }
    }

    if (!time) {
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('medication_id', medicationId)
        .eq('user_id', user.id);
      if (error) {
        if (isMissingReminderTable(error)) {
          try {
            const localReminders = saveLocalMedicationReminder(user.id, medicationId, '');
            setReminders(Object.fromEntries(
              localReminders.map((reminder) => [reminder.medication_id, reminder])
            ));
            if (notificationPermission !== 'granted') {
              setErrorMessage('Reminder saved on this device, but browser notifications are blocked. Allow notifications in your browser settings.');
            }
            return;
          } catch (localError) {
            setErrorMessage(
              localError instanceof Error ? localError.message : 'Unable to remove the local reminder.'
            );
            return;
          }
        }
        setErrorMessage(error.message);
        return;
      }
      setReminders((current) => {
        const next = { ...current };
        delete next[medicationId];
        return next;
      });
      notifyMedicationRemindersUpdated();
      if (notificationPermission !== 'granted') {
        setErrorMessage('Reminder removed. Allow browser notifications to receive medication popups.');
      }
      return;
    }

    const { data, error } = await supabase
      .from('medication_reminders')
      .upsert(
        {
          user_id: user.id,
          medication_id: medicationId,
          reminder_time: time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          enabled: true,
        },
        { onConflict: 'medication_id' }
      )
      .select('id, medication_id, reminder_time, timezone, enabled')
      .single();

    if (error) {
      if (isMissingReminderTable(error)) {
        try {
          const localReminders = saveLocalMedicationReminder(user.id, medicationId, time);
          setReminders(Object.fromEntries(
            localReminders.map((reminder) => [reminder.medication_id, reminder])
          ));
          if (notificationPermission !== 'granted') {
            setErrorMessage('Reminder saved on this device, but browser notifications are blocked. Allow notifications in your browser settings.');
          }
          return;
        } catch (localError) {
          setErrorMessage(
            localError instanceof Error ? localError.message : 'Unable to save a reminder on this device.'
          );
          return;
        }
      }
      setErrorMessage(error.message);
      return;
    }
    setReminders((current) => ({
      ...current,
      [medicationId]: data as MedicationReminder,
    }));
    notifyMedicationRemindersUpdated();
    if (notificationPermission !== 'granted') {
      setErrorMessage('Reminder saved, but browser notifications are blocked. Allow notifications in your browser settings.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  const activeMeds = medications.filter((m) => m.status === 'active');
  const pastMeds = medications.filter((m) => m.status !== 'active');

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.medicationsTitle}</h2>
          <p className="text-muted mb-0">{t.medicationsSubtitle}</p>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} /> {t.addMedication}
        </button>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      <div className="alert alert-info py-2 small" role="note">
        {t.reminderPermissionHelp}
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>
                {editing ? t.editMedication : t.addNewMedication}
              </h5>
              <button className="btn btn-sm btn-link text-danger p-0" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">{t.medicineName}</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Metformin"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">{t.dosage}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">{t.frequency}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    placeholder="e.g., Twice daily"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">{t.startDate}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">{t.endDate}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">{t.status}</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">{t.active}</option>
                    <option value="completed">{t.completed}</option>
                    <option value="discontinued">{t.discontinued}</option>
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">{t.prescribedFor}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.prescribed_for}
                    onChange={(e) => setForm({ ...form, prescribed_for: e.target.value })}
                    placeholder="e.g., Diabetes"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">{t.notes}</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-success">
                    {editing ? t.updateMedication : t.addMedicationBtn}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <Pill size={40} className="mb-2 opacity-50" />
            <p className="mb-2">{t.noMedicationsYet}</p>
            <button className="btn btn-success btn-sm" onClick={() => setShowForm(true)}>
              {t.addFirstMedication}
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeMeds.length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-2" style={{ color: '#1b4332' }}>
                {t.activeMeds} ({activeMeds.length})
              </h5>
              <div className="row g-3">
                {activeMeds.map((med) => (
                  <MedCard
                    key={med.id}
                    med={med}
                    onEdit={() => handleEdit(med)}
                    onDelete={() => handleDelete(med.id)}
                    onStatusChange={(s) => handleStatusChange(med, s)}
                    reminder={reminders[med.id]}
                    onSaveReminder={(time) => saveReminder(med.id, time)}
                  />
                ))}
              </div>
            </div>
          )}

          {pastMeds.length > 0 && (
            <div>
              <h5 className="fw-bold mb-2 text-muted">
                {t.pastMeds} ({pastMeds.length})
              </h5>
              <div className="row g-3">
                {pastMeds.map((med) => (
                  <MedCard
                    key={med.id}
                    med={med}
                    onEdit={() => handleEdit(med)}
                    onDelete={() => handleDelete(med.id)}
                    onStatusChange={(s) => handleStatusChange(med, s)}
                    reminder={reminders[med.id]}
                    onSaveReminder={(time) => saveReminder(med.id, time)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MedCard({
  med,
  onEdit,
  onDelete,
  onStatusChange,
  reminder,
  onSaveReminder,
}: {
  med: Medication;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  reminder?: MedicationReminder;
  onSaveReminder: (time: string) => Promise<void>;
}) {
  const { t } = useLang();
  const [reminderTime, setReminderTime] = useState(reminder?.reminder_time.slice(0, 5) || '');

  useEffect(() => {
    setReminderTime(reminder?.reminder_time.slice(0, 5) || '');
  }, [reminder]);
  const statusLabels: Record<string, string> = {
    active: t.active,
    completed: t.completed,
    discontinued: t.discontinued,
  };
  const statusColors: Record<string, string> = {
    active: 'bg-success-subtle text-success',
    completed: 'bg-secondary-subtle text-secondary',
    discontinued: 'bg-warning-subtle text-warning',
  };

  return (
    <div className="col-12 col-md-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{med.name}</h6>
              {med.dosage && <span className="text-muted small">{med.dosage}</span>}
            </div>
            <span className={`badge ${statusColors[med.status] || ''}`}>{statusLabels[med.status] || med.status}</span>
          </div>

          <div className="small text-muted mb-2">
            {med.frequency && <div>{t.frequency}: {med.frequency}</div>}
            {med.prescribed_for && <div>{t.prescribedFor}: {med.prescribed_for}</div>}
            {med.start_date && (
              <div>
                {med.start_date ? new Date(med.start_date).toLocaleDateString() : ''}
                {med.end_date ? ` — ${new Date(med.end_date).toLocaleDateString()}` : ` — ${t.ongoing}`}
              </div>
            )}
            {med.notes && <div className="mt-1">{med.notes}</div>}
          </div>

            <div className="border-top pt-2 mb-3">
              <label className="form-label small fw-semibold mb-1">{t.medicationReminder}</label>
              <div className="d-flex gap-2">
                <input
                  type="time"
                  className="form-control form-control-sm"
                  value={reminderTime}
                  onChange={(event) => setReminderTime(event.target.value)}
                  aria-label={t.medicationReminder}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success text-nowrap"
                  onClick={() => void onSaveReminder(reminderTime)}
                  disabled={!reminderTime && !reminder}
                >
                  {reminder ? t.updateReminder : t.setReminder}
                </button>
                {reminder && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger text-nowrap"
                    onClick={() => {
                      setReminderTime('');
                      void onSaveReminder('');
                    }}
                  >
                    {t.removeReminder}
                  </button>
                )}
              </div>
            </div>

          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={onEdit}>
              <Edit3 size={14} className="me-1" /> {t.edit}
            </button>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={med.status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="active">{t.active}</option>
              <option value="completed">{t.completed}</option>
              <option value="discontinued">{t.discontinued}</option>
            </select>
            <button className="btn btn-sm btn-link text-danger p-1" onClick={onDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
