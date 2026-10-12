import { Settings as SettingsIcon, Globe, Info } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Language } from '@/lib/translations';

export function SettingsPage() {
  const { lang, setLang, t } = useLang();

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: '#1b4332' }}>{t.settingsTitle}</h2>
        <p className="text-muted mb-0">{t.settingsSubtitle}</p>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Globe size={22} color="#2d6a4f" />
                <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.languageSection}</h5>
              </div>
              <p className="text-muted small mb-3">{t.currentLanguage}: <strong>{lang === 'en' ? t.english : t.telugu}</strong></p>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div
                    className={`card h-100 ${lang === 'en' ? 'border-success border-2' : 'border'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setLang('en' as Language)}
                  >
                    <div className="card-body d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: '40px', height: '40px', backgroundColor: '#2d6a4f15' }}
                      >
                        <span className="fw-bold" style={{ color: '#2d6a4f' }}>EN</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{t.languageEn}</div>
                        <small className="text-muted">{t.languageEnDesc}</small>
                      </div>
                      {lang === 'en' && (
                        <div className="text-success">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div
                    className={`card h-100 ${lang === 'te' ? 'border-success border-2' : 'border'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setLang('te' as Language)}
                  >
                    <div className="card-body d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: '40px', height: '40px', backgroundColor: '#2d6a4f15' }}
                      >
                        <span className="fw-bold" style={{ color: '#2d6a4f' }}>TE</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{t.languageTe}</div>
                        <small className="text-muted">{t.languageTeDesc}</small>
                      </div>
                      {lang === 'te' && (
                        <div className="text-success">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border mt-3 mb-0 small">
                <strong>{t.currentLanguage}:</strong> {lang === 'en' ? t.languageEn : t.languageTe}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Info size={22} color="#2d6a4f" />
                <h5 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.aboutSection}</h5>
              </div>
              <p className="text-muted small mb-2">{t.aboutText}</p>
              <small className="text-muted">{t.version}</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <SettingsIcon size={20} color="#2d6a4f" />
                <h6 className="fw-bold mb-0" style={{ color: '#1b4332' }}>{t.settingsTitle}</h6>
              </div>
              <p className="small text-muted mb-0">
                {t.languageSection} — {t.languageEn} / {t.languageTe}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
