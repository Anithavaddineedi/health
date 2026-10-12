import { HeartPulse } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="app-splash" role="status" aria-label="Health Copilot is starting">
      <div className="app-splash-glow app-splash-glow-left" />
      <div className="app-splash-glow app-splash-glow-right" />

      <div className="app-splash-content">
        <div className="app-splash-logo">
          <HeartPulse size={54} strokeWidth={1.8} />
        </div>
        <h1 className="app-splash-title">Health Copilot</h1>
        <p className="app-splash-tagline">Your health, in better hands</p>
        <div className="app-splash-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="app-splash-footer">AI-powered personal health assistant</div>
    </div>
  );
}
