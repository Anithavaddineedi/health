import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { User, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';

export function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [abhaLinked, setAbhaLinked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    phone: '',
    abha_id: '',
    emergency_contact: '',
    allergies: '',
    chronic_conditions: '',
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
    } else if (data) {
      setForm({
        full_name: data.full_name || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        blood_group: data.blood_group || '',
        phone: data.phone || '',
        abha_id: data.abha_id || '',
        emergency_contact: data.emergency_contact || '',
        allergies: (data.allergies || []).join(', '),
        chronic_conditions: (data.chronic_conditions || []).join(', '),
      });
      if (data.abha_id) setAbhaLinked(true);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setErrorMessage('');

    const payload = {
      id: user.id,
      full_name: form.full_name,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      blood_group: form.blood_group,
      phone: form.phone,
      abha_id: form.abha_id,
      emergency_contact: form.emergency_contact,
      allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
      chronic_conditions: form.chronic_conditions.split(',').map((s) => s.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setSaved(true);
    setAbhaLinked(Boolean(form.abha_id));
    setTimeout(() => setSaved(false), 3000);
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
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.profileTitle}</h2>
        <p className="text-muted mb-0">{t.profileSubtitle}</p>
      </div>

      {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSave}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: '56px', height: '56px', backgroundColor: '#2d6a4f' }}
                  >
                    <User size={28} color="white" />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{form.full_name || t.yourName}</h5>
                    <small className="text-muted">{user?.email}</small>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">{t.fullName}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">{t.dateOfBirth}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">{t.gender}</label>
                    <select
                      className="form-select"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="">{t.select}</option>
                      <option value="male">{t.male}</option>
                      <option value="female">{t.female}</option>
                      <option value="other">{t.other}</option>
                    </select>
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">{t.bloodGroup}</label>
                    <select
                      className="form-select"
                      value={form.blood_group}
                      onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                    >
                      <option value="">{t.select}</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">{t.phone}</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g., +91 9876543210"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">{t.emergencyContact}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.emergency_contact}
                      onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                      placeholder="Name and phone number"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">{t.allergies}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.allergies}
                      onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                      placeholder="e.g., Penicillin, Dust"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">{t.chronicConditions}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.chronic_conditions}
                      onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
                      placeholder="e.g., Diabetes, Hypertension"
                    />
                  </div>

                  <div className="col-12">
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.abhaLinking}</h6>
                      {abhaLinked && (
                        <span className="badge bg-success-subtle text-success">
                          <Check size={14} className="me-1" /> {t.linked}
                        </span>
                      )}
                    </div>
                    <p className="small text-muted mt-1 mb-2">
                      {t.abhaDescription}
                    </p>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        value={form.abha_id}
                        onChange={(event) => setForm({ ...form, abha_id: event.target.value })}
                        placeholder={t.noAbhaLinked}
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <button type="submit" className="btn btn-success d-flex align-items-center gap-2" disabled={saving}>
                      {saving ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <Save size={18} />
                      )}
                      {t.saveProfile}
                    </button>
                    {saved && (
                      <span className="text-success ms-3 small">
                        <Check size={16} className="me-1" /> {t.profileSaved}
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: '#1b4332' }}>{t.profileSummary}</h6>
              <div className="mb-2">
                <small className="text-muted d-block">{t.bloodGroup}</small>
                <span className="fw-semibold">{form.blood_group || t.notSet}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">{t.allergies}</small>
                <span className="fw-semibold">{form.allergies || t.noneRecorded}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">{t.chronicConditions}</small>
                <span className="fw-semibold">{form.chronic_conditions || t.noneRecorded}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted d-block">{t.abhaLinking}</small>
                <span className="fw-semibold">{form.abha_id || t.notLinked}</span>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="fw-bold mb-2" style={{ color: '#1b4332' }}>{t.privacy}</h6>
              <p className="small text-muted mb-0">
                {t.privacyText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
