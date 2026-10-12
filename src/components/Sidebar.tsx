import { Activity, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { Page } from '@/types';

export function Sidebar({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { signOut } = useAuth();
  const { t } = useLang();

  const navItems: { id: Page; label: string }[] = [
    { id: 'dashboard', label: t.navDashboard },
    { id: 'upload', label: t.navUpload },
    { id: 'records', label: t.navRecords },
    { id: 'medications', label: t.navMedications },
    { id: 'appointments', label: t.navAppointments },
    { id: 'healthtrends', label: t.navHealthTrends },
    { id: 'healthinsurance', label: t.navInsurance },
    { id: 'timeline', label: t.navTimeline },
    { id: 'summaries', label: t.navSummaries },
    { id: 'profile', label: t.navProfile },
    { id: 'settings', label: t.navSettings },
  ];

  return (
    <>
      {isOpen && <div className="offcanvas-backdrop fade show d-lg-none" onClick={onClose} />}
      <nav
        className={`sidebar health-sidebar d-flex flex-column ${isOpen ? 'show' : ''}`}
        style={{
          width: '260px',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1040,
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: '40px', height: '40px', backgroundColor: '#2d6a4f' }}
            >
              <Activity size={22} color="white" />
            </div>
            <div>
              <h6 className="mb-0 fw-bold" style={{ color: '#1b4332' }}>{t.appName}</h6>
              <small className="text-muted">{t.appTagline}</small>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 p-3 overflow-auto">
          <ul className="nav nav-pills flex-column gap-1">
            {navItems.map((item) => (
              <li className="nav-item" key={item.id}>
                <button
                  className={`nav-link health-nav-link text-start w-100 rounded ${currentPage === item.id ? 'active' : ''}`}
                  style={{
                    backgroundColor: currentPage === item.id ? '#2d6a4f' : 'transparent',
                    color: currentPage === item.id ? 'white' : '#495057',
                  }}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 border-top">
          <button
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={() => signOut()}
          >
            <LogOut size={18} />
            {t.signOut}
          </button>
        </div>
      </nav>
    </>
  );
}
