import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Video,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Disclaimer } from '@/components/Disclaimer';
import { VideoCallRoom } from '@/components/VideoCallRoom';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  slots: string[];
}

interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  hospital: string;
  scheduled_at: string;
  visit_type: 'inPerson' | 'video';
  notes: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

const doctors: Doctor[] = [
  {
    id: 'dr-arjun',
    name: 'Dr. Arjun',
    specialty: 'General Medicine',
    hospital: 'Health Copilot Video Clinic',
    slots: ['10:45', '12:15', '13:30', '15:00', '17:00'],
  },
];

function isMissingAppointmentsTable(error: { code?: string; message: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message.includes('appointments') &&
      error.message.toLowerCase().includes('schema cache'))
  );
}

function appointmentStorageKey(userId: string) {
  return `health_copilot_appointments:${userId}`;
}

function readLocalAppointments(userId: string): Appointment[] {
  const serialized = localStorage.getItem(appointmentStorageKey(userId));
  if (!serialized) return [];

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved appointments on this device have an invalid format.');
  }
  return parsed as Appointment[];
}

function saveLocalAppointment(userId: string, appointment: Appointment) {
  const appointments = readLocalAppointments(userId);
  localStorage.setItem(
    appointmentStorageKey(userId),
    JSON.stringify([appointment, ...appointments.filter((item) => item.id !== appointment.id)])
  );
}

function cancelLocalAppointment(userId: string, appointmentId: string) {
  const appointments = readLocalAppointments(userId).map((appointment) =>
    appointment.id === appointmentId ? { ...appointment, status: 'cancelled' as const } : appointment
  );
  localStorage.setItem(appointmentStorageKey(userId), JSON.stringify(appointments));
  return appointments;
}

function getDefaultDate() {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AppointmentsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [incomingCalls, setIncomingCalls] = useState<Appointment[]>([]);
  const [isArjunDoctor, setIsArjunDoctor] = useState(false);
  const [calling, setCalling] = useState(false);
  const [activeCall, setActiveCall] = useState<Appointment | null>(null);
  const [activeCallDemo, setActiveCallDemo] = useState(false);
  const [form, setForm] = useState({
    doctorId: doctors[0].id,
    date: getDefaultDate(),
    time: doctors[0].slots[0],
    visitType: 'inPerson' as 'inPerson' | 'video',
    notes: '',
  });

  const loadAppointments = useCallback(async () => {
    if (!user) return;
    setErrorMessage('');
    const { data, error } = await supabase
      .from('appointments')
      .select('id, user_id, doctor_id, doctor_name, specialty, hospital, scheduled_at, visit_type, notes, status, created_at')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });
    if (error) {
      if (isMissingAppointmentsTable(error)) {
        try {
          setAppointments(readLocalAppointments(user.id));
        } catch (localError) {
          setErrorMessage(
            localError instanceof Error ? localError.message : 'Unable to read appointments saved on this device.'
          );
        }
      } else {
        setErrorMessage(error.message);
      }
      setLoading(false);
      return;
    }
    setAppointments((data ?? []) as Appointment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const loadIncomingCalls = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_arjun_incoming_calls');
    if (error) {
      if (error.code !== 'PGRST202' && error.code !== '42883' && !isMissingAppointmentsTable(error)) {
        setErrorMessage(error.message);
      }
      return;
    }
    setIncomingCalls((data ?? []) as Appointment[]);
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    let cancelled = false;

    const checkDoctorAccount = async () => {
      const { data, error } = await supabase.rpc('is_arjun_doctor');
      if (cancelled) return;
      if (error) {
        if (error.code !== 'PGRST202' && error.code !== '42883' && !isMissingAppointmentsTable(error)) {
          setErrorMessage(error.message);
        }
        return;
      }
      setIsArjunDoctor(data === true);
      if (data === true) {
        await loadIncomingCalls();
        interval = window.setInterval(() => void loadIncomingCalls(), 5000);
      }
    };

    void checkDoctorAccount();
    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [loadIncomingCalls, user]);

  useEffect(() => {
    const selected = doctors.find((doctor) => doctor.id === form.doctorId) ?? doctors[0];
    if (!selected.slots.includes(form.time)) {
      setForm((current) => ({ ...current, time: selected.slots[0] }));
    }
  }, [form.doctorId, form.time]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === form.doctorId) ?? doctors[0],
    [form.doctorId]
  );
  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'confirmed'),
    [appointments]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setErrorMessage('');
    setSuccessMessage('');

    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      setErrorMessage('Choose a future appointment date and time.');
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      user_id: user.id,
      doctor_id: selectedDoctor.id,
      doctor_name: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      hospital: selectedDoctor.hospital,
      scheduled_at: scheduledAt.toISOString(),
      visit_type: form.visitType,
      notes: form.notes.trim(),
      status: 'confirmed',
    });
    if (error) {
      if (isMissingAppointmentsTable(error)) {
        try {
          const localAppointment: Appointment = {
            id: `local-${crypto.randomUUID()}`,
            user_id: user.id,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            specialty: selectedDoctor.specialty,
            hospital: selectedDoctor.hospital,
            scheduled_at: scheduledAt.toISOString(),
            visit_type: form.visitType,
            notes: form.notes.trim(),
            status: 'confirmed',
            created_at: new Date().toISOString(),
          };
          saveLocalAppointment(user.id, localAppointment);
          setAppointments((current) => [localAppointment, ...current]);
          setSuccessMessage('Appointment saved on this device only. It is not synced with the doctor.');
        } catch (localError) {
          setErrorMessage(
            localError instanceof Error ? localError.message : 'Unable to save this appointment on this device.'
          );
          return;
        }
      } else {
        setErrorMessage(error.message);
        return;
      }
    } else {
      setSuccessMessage(t.bookAppointment);
      await loadAppointments();
    }

    setForm((current) => ({
      ...current,
      date: getDefaultDate(),
      time: selectedDoctor.slots[0],
      notes: '',
    }));
    await loadAppointments();
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!user) return;
    setErrorMessage('');
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .eq('user_id', user.id);
    if (error) {
      if (isMissingAppointmentsTable(error)) {
        try {
          setAppointments(cancelLocalAppointment(user.id, appointmentId));
        } catch (localError) {
          setErrorMessage(
            localError instanceof Error ? localError.message : 'Unable to cancel the appointment saved on this device.'
          );
        }
      } else {
        setErrorMessage(error.message);
      }
      return;
    }
    await loadAppointments();
  };

  const callDrArjun = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setCalling(true);
    try {
      const { data: appointmentId, error } = await supabase.rpc('start_direct_video_call');
      if (error) {
        const backendNotConfigured =
          error.message.includes('Dr. Arjun is not configured') ||
          error.code === 'PGRST202' ||
          error.code === '42883';
        if (!backendNotConfigured) throw error;

        setActiveCallDemo(true);
        setActiveCall({
          id: `demo-${Date.now()}`,
          user_id: user?.id ?? '',
          doctor_id: 'dr-arjun',
          doctor_name: 'Dr. Arjun',
          specialty: 'General Medicine',
          hospital: 'Health Copilot Video Clinic',
          scheduled_at: new Date().toISOString(),
          visit_type: 'video',
          notes: '',
          status: 'confirmed',
          created_at: new Date().toISOString(),
        });
        setSuccessMessage('Demo call started. Your camera preview is open; this is not a real doctor connection.');
        return;
      }
      const { data, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, user_id, doctor_id, doctor_name, specialty, hospital, scheduled_at, visit_type, notes, status, created_at')
        .eq('id', appointmentId)
        .single();
      if (appointmentError) throw appointmentError;
      setActiveCallDemo(false);
      setActiveCall(data as Appointment);
      setSuccessMessage('Calling Dr. Arjun...');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setCalling(false);
    }
  };

  const answerIncomingCall = (appointment: Appointment) => {
    setActiveCallDemo(false);
    setActiveCall(appointment);
  };

  const endActiveCall = async () => {
    if (!activeCall) return;
    if (activeCallDemo) {
      setActiveCall(null);
      setActiveCallDemo(false);
      return;
    }
    const { error } = await supabase.rpc('finish_direct_video_call', {
      target_appointment_id: activeCall.id,
    });
    if (error) setErrorMessage(error.message);
    setActiveCall(null);
    await loadAppointments();
    if (isArjunDoctor) await loadIncomingCalls();
  };

  const refreshIncomingCalls = () => {
    void loadIncomingCalls();
  };

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
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.appointmentsTitle}</h2>
        <p className="text-muted mb-0">{t.appointmentsSubtitle}</p>
      </div>
      <div className="mb-3"><Disclaimer variant="compact" /></div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success py-2" role="status">{successMessage}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h5 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.callArjun}</h5>
            <p className="text-muted small mb-0">{t.directCallSubtitle}</p>
          </div>
          <button
            type="button"
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={() => void callDrArjun()}
            disabled={calling}
          >
            <Video size={18} /> {calling ? t.callConnecting : t.callArjun}
          </button>
        </div>
      </div>

      {isArjunDoctor && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.incomingCallsForArjun}</h5>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={refreshIncomingCalls}>
                {t.refreshCalls}
              </button>
            </div>
            {incomingCalls.length === 0 ? (
              <p className="text-muted small mb-0">{t.noIncomingCalls}</p>
            ) : (
              <div className="d-grid gap-2">
                {incomingCalls.map((call) => (
                  <div key={call.id} className="d-flex justify-content-between align-items-center gap-3 border rounded-3 p-3">
                    <div>
                      <div className="fw-semibold">{t.incomingPatientCall}</div>
                      <small className="text-muted">{new Date(call.created_at).toLocaleTimeString()}</small>
                    </div>
                    <button type="button" className="btn btn-success btn-sm" onClick={() => answerIncomingCall(call)}>
                      <Video size={15} className="me-1" /> {t.answerCall}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <CalendarDays size={22} color="#2d6a4f" />
                <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.scheduleAppointment}</h5>
              </div>

              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">{t.doctor}</label>
                  <select
                    className="form-select"
                    value={form.doctorId}
                    onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}
                  >
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <div className="border rounded-3 p-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <div>
                        <div className="fw-semibold" style={{ color: '#1b4332' }}>{selectedDoctor.name}</div>
                        <small className="text-muted">{selectedDoctor.specialty}</small>
                      </div>
                    </div>
                    <div className="small text-muted d-flex flex-column gap-1">
                      <span className="d-flex align-items-center gap-2"><MapPin size={14} /> {selectedDoctor.hospital}</span>
                      <span className="d-flex align-items-center gap-2"><Stethoscope size={14} /> {selectedDoctor.specialty}</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">{t.appointmentDate}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.date}
                    min={getDefaultDate()}
                    required
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">{t.preferredTime}</label>
                  <select
                    className="form-select"
                    value={form.time}
                    onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                  >
                    {selectedDoctor.slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">{t.visitType}</label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${form.visitType === 'inPerson' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setForm((current) => ({ ...current, visitType: 'inPerson' }))}
                    >{t.inPerson}</button>
                    <button
                      type="button"
                      className={`btn ${form.visitType === 'video' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setForm((current) => ({ ...current, visitType: 'video' }))}
                    >{t.videoConsult}</button>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">{t.symptoms}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </div>
                <div className="col-12 d-flex gap-2 align-items-center justify-content-between">
                  <div className="small text-muted d-flex align-items-center gap-2">
                    <ShieldCheck size={16} color="#2d6a4f" /> Secure consultation booking
                  </div>
                  <button type="submit" className="btn btn-success">{t.bookAppointment}</button>
                </div>
              </form>
            </div>
          </div>

        </div>

        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.upcomingAppointments}</h5>
                <span className="badge bg-success-subtle text-success">{upcomingAppointments.length}</span>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <CalendarDays size={38} className="mb-2 opacity-50" />
                  <p className="mb-0">{t.noAppointmentsYet}</p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {upcomingAppointments.map((appointment) => {
                    const scheduledAt = new Date(appointment.scheduled_at);
                    return (
                      <div key={appointment.id} className="border rounded-3 p-3 bg-light-subtle">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <div>
                            <div className="fw-semibold" style={{ color: '#1b4332' }}>{appointment.doctor_name}</div>
                            <small className="text-muted">{appointment.specialty}</small>
                          </div>
                          <span className="badge bg-success-subtle text-success">Confirmed</span>
                        </div>
                        <div className="row g-2 small text-muted">
                          <div className="col-12 col-md-6 d-flex align-items-center gap-2">
                            <CalendarDays size={15} /> {scheduledAt.toLocaleDateString()}
                          </div>
                          <div className="col-12 col-md-6 d-flex align-items-center gap-2">
                            <Clock3 size={15} /> {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="col-12 col-md-6 d-flex align-items-center gap-2">
                            <MapPin size={15} /> {appointment.hospital}
                          </div>
                          <div className="col-12 col-md-6 d-flex align-items-center gap-2">
                            {appointment.visit_type === 'video' ? <Video size={15} /> : <MapPin size={15} />}
                            {appointment.visit_type === 'video' ? t.videoConsult : t.inPerson}
                          </div>
                        </div>
                        {appointment.notes && <div className="mt-3 small text-muted"><strong>Reason:</strong> {appointment.notes}</div>}

                        {appointment.visit_type === 'video' && (
                          <div className="mt-3 d-flex flex-wrap align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => setActiveCall(appointment)}
                            ><Video size={14} className="me-1" />Call {appointment.doctor_name}</button>
                          </div>
                        )}

                        <div className="mt-3 d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => void cancelAppointment(appointment.id)}
                          ><XCircle size={14} className="me-1" />{t.cancelAppointment}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeCall && (
        <VideoCallRoom
          appointmentId={activeCall.id}
          appointmentTitle={activeCall.doctor_name}
          isOwner={activeCall.user_id === user?.id}
          demoMode={activeCallDemo}
          onClose={() => void endActiveCall()}
        />
      )}
    </div>
  );
}
