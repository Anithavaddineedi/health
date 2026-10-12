import { useEffect, useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppLayout } from '@/components/AppLayout';
import { SplashScreen } from '@/components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimeout = window.setTimeout(() => setShowSplash(false), 1800);
    return () => window.clearTimeout(splashTimeout);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppLayout />
        {showSplash && <SplashScreen />}
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
