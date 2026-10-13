import { useState, FormEvent } from 'react';
import { Activity, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Language } from '@/lib/translations';

type LoginMode = 'signin' | 'signup' | 'forgot' | 'update-password';

interface LoginPageProps {
  passwordRecovery?: boolean;
}

export function LoginPage({ passwordRecovery = false }: LoginPageProps) {
  const {
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    finishPasswordRecovery,
  } = useAuth();
  const { t, lang, setLang } = useLang();
  const [mode, setMode] = useState<LoginMode>(passwordRecovery ? 'update-password' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  const changeMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    setPassword('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if ((mode === 'signin' || mode === 'signup' || mode === 'update-password') && password.length < 6) {
      setError(t.passwordShort);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      } else if (mode === 'signup') {
        const result = await signUp(email, password, fullName);
        if (result.error) {
          setError(result.error);
        } else if (result.confirmationRequired) {
          changeMode('signin');
          setSuccess(t.signupEmailSent);
        }
      } else if (mode === 'forgot') {
        const result = await requestPasswordReset(email);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(t.resetEmailSent);
        }
      } else {
        const result = await updatePassword(password);
        if (result.error) {
          setError(result.error);
        } else {
          setPasswordUpdated(true);
          setSuccess(t.passwordUpdated);
        }
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showPassword = mode === 'signin' || mode === 'signup' || mode === 'update-password';

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
              <p className="text-muted small">{t.loginSubtitle}</p>
            </div>

            <div className="d-flex justify-content-end mb-2">
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${lang === 'en' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setLang('en' as Language)}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`btn ${lang === 'te' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setLang('te' as Language)}
                >
                  TE
                </button>
              </div>
            </div>

            {(mode === 'signin' || mode === 'signup') && (
              <div className="btn-group w-100 mb-3" role="group" aria-label="Account access">
                <button
                  type="button"
                  className={`btn ${mode === 'signin' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => changeMode('signin')}
                >
                  {t.signIn}
                </button>
                <button
                  type="button"
                  className={`btn ${mode === 'signup' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => changeMode('signup')}
                >
                  {t.signUp}
                </button>
              </div>
            )}

            {mode === 'update-password' && (
              <h5 className="text-center mb-3">{t.updatePassword}</h5>
            )}

            {!passwordUpdated ? (
              <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="full-name">{t.fullName}</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <UserIcon size={18} color="#6c757d" />
                      </span>
                      <input
                        id="full-name"
                        type="text"
                        className="form-control"
                        placeholder={t.fullNamePlaceholder}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode !== 'update-password' && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="email">{t.email}</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <Mail size={18} color="#6c757d" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        className="form-control"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                )}

                {showPassword && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold" htmlFor="password">
                      {mode === 'update-password' ? t.newPassword : t.password}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <Lock size={18} color="#6c757d" />
                      </span>
                      <input
                        id="password"
                        type="password"
                        className="form-control"
                        placeholder={t.passwordPlaceholder}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="text-end mb-3">
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => changeMode('forgot')}>
                      {t.forgotPassword}
                    </button>
                  </div>
                )}

                {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
                {success && <div className="alert alert-success py-2 small" role="status">{success}</div>}

                <button type="submit" className="btn btn-success w-100" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  {mode === 'signin'
                    ? t.signIn
                    : mode === 'signup'
                      ? t.createAccount
                      : mode === 'forgot'
                        ? t.sendResetEmail
                        : t.updatePassword}
                </button>
              </form>
            ) : (
              <div>
                <div className="alert alert-success py-2 small" role="status">{success}</div>
                <button
                  type="button"
                  className="btn btn-success w-100"
                  onClick={finishPasswordRecovery}
                >
                  {t.continue}
                </button>
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <p className="text-center small mt-3 mb-0">
                {mode === 'signin' ? t.noAccount : t.haveAccount}{' '}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 align-baseline"
                  onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}
                >
                  {mode === 'signin' ? t.signUp : t.signIn}
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link btn-sm"
                  onClick={() => changeMode('signin')}
                >
                  {t.backToSignIn}
                </button>
              </div>
            )}

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
