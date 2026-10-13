import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Dashboard } from '@/pages/Dashboard';
import { UploadPage } from '@/pages/UploadPage';
import { MedicalRecords } from '@/pages/MedicalRecords';
import { MedicationsPage } from '@/pages/MedicationsPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { HealthTrendsPage } from '@/pages/HealthTrendsPage';
import { HealthInsurancePage } from '@/pages/HealthInsurancePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SummariesPage } from '@/pages/SummariesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MedicationReminderRunner } from '@/components/MedicationReminderRunner';
import { Page } from '@/types';

export function AppLayout() {
  const { user, loading, passwordRecovery } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (passwordRecovery) {
    return <LoginPage passwordRecovery />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'upload':
        return <UploadPage />;
      case 'records':
        return <MedicalRecords />;
      case 'medications':
        return <MedicationsPage />;
      case 'appointments':
        return <AppointmentsPage />;
      case 'healthtrends':
        return <HealthTrendsPage />;
      case 'healthinsurance':
        return <HealthInsurancePage />;
      case 'timeline':
        return <TimelinePage />;
      case 'profile':
        return <ProfilePage />;
      case 'summaries':
        return <SummariesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="health-shell min-vh-100">
      <MedicationReminderRunner />
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="d-lg-block" style={{ marginLeft: '0' }}>
        <div className="main-content" style={{ marginLeft: '0' }}>
          <Navbar onMenuClick={() => setSidebarOpen(true)} onNavigate={setCurrentPage} />
          <div className="health-page-container container-fluid p-3 p-md-4">
            <div className="row justify-content-center">
              <div className="col-12 col-xl-10">{renderPage()}</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 992px) {
          .main-content { margin-left: 260px !important; }
          .sidebar { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
}
