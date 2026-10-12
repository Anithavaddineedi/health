import { useState, FormEvent } from 'react';
import { Activity, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Language } from '@/lib/translations';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { t, lang, setLang } = useLang();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError(t.passwordShort);
      setLoading(false);
      return;
    }

    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center p-3 p-lg-5">
      <div className="login-layout">
        <section className="login-visual" aria-label="Healthcare illustration">
          <img
            className="login-illustration"
            src="/medical-login-illustration.svg"
            alt="Illustration of a doctor with a medical report"
          />
          <div className="login-visual-copy">
            <span className="login-visual-eyebrow">YOUR HEALTH, IN FOCUS</span>
            <h2>Care that keeps<br />you connected.</h2>
            <p>Keep your reports, medicines and appointments together in one calm, secure space.</p>
          </div>
        </section>

        <div className="card shadow-sm login-card">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: '64px', height: '64px', backgroundColor: '#2d6a4f' }}
            >
              <Activity size={32} color="white" />
            </div>
            <h3 className="fw-bold mb-1" style={{ color: '#1b4332' }}>
              {t.loginTitle}
            </h3>
            <p className="text-muted small">
              {t.loginSubtitle}
            </p>
          </div>

          <div className="d-flex justify-content-end mb-2">
            <div className="btn-group btn-group-sm">
              <button
                className={`btn ${lang === 'en' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setLang('en' as Language)}
              >
                EN
              </button>
              <button
                className={`btn ${lang === 'te' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setLang('te' as Language)}
              >
                TE
              </button>
            </div>
          </div>

          <div className="btn-group w-100 mb-3" role="group">
            <button
              className={`btn ${mode === 'signin' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setMode('signin')}
            >
              {t.signIn}
            </button>
            <button
              className={`btn ${mode === 'signup' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setMode('signup')}
            >
              {t.signUp}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="mb-3">
                <label className="form-label small fw-semibold">{t.fullName}</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <UserIcon size={18} color="#6c757d" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold">{t.email}</label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <Mail size={18} color="#6c757d" />
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">{t.password}</label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <Lock size={18} color="#6c757d" />
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              {mode === 'signin' ? t.signIn : t.createAccount}
            </button>
          </form>

          <div className="mt-3">
            <div className="alert alert-light border small mb-0" role="alert">
              <strong>{t.privacyNotice}</strong> {t.privacyNoticeText}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
