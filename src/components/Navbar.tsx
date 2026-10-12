import { Menu, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Language } from '@/lib/translations';
import { Page } from '@/types';
import { useState, useRef, useEffect } from 'react';

export function Navbar({
  onMenuClick,
  onNavigate,
}: {
  onMenuClick: () => void;
  onNavigate: (page: Page) => void;
}) {
  const { user } = useAuth();
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className="navbar health-navbar sticky-top border-bottom"
      style={{ backgroundColor: 'white', borderColor: '#e0e0e0' }}
    >
      <div className="container-fluid px-3">
        <button className="btn btn-link d-lg-none p-1" onClick={onMenuClick}>
          <Menu size={24} color="#2d6a4f" />
        </button>
        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="position-relative" ref={langRef}>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => setLangOpen(!langOpen)}
            >
              <Globe size={16} />
              {lang === 'en' ? 'EN' : 'TE'}
            </button>
            {langOpen && (
              <div
                className="position-absolute end-0 mt-1 bg-white border rounded shadow-sm py-1"
                style={{ zIndex: 1050, minWidth: '160px' }}
              >
                <button
                  className={`dropdown-item btn btn-link text-start w-100 small ${lang === 'en' ? 'fw-bold text-success' : ''}`}
                  onClick={() => { setLang('en' as Language); setLangOpen(false); }}
                >
                  {t.english}
                </button>
                <button
                  className={`dropdown-item btn btn-link text-start w-100 small ${lang === 'te' ? 'fw-bold text-success' : ''}`}
                  onClick={() => { setLang('te' as Language); setLangOpen(false); }}
                >
                  {t.telugu}
                </button>
                <hr className="my-1" />
                <button
                  className="dropdown-item btn btn-link text-start w-100 small"
                  onClick={() => { setLangOpen(false); onNavigate('settings'); }}
                >
                  {t.settingsTitle}
                </button>
              </div>
            )}
          </div>
          <div className="text-end">
            <small className="text-muted d-block">{t.welcome}</small>
            <small className="fw-semibold" style={{ color: '#1b4332' }}>
              {user?.email}
            </small>
          </div>
        </div>
      </div>
    </nav>
  );
}
