import { AlertTriangle } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

export function Disclaimer({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const { t } = useLang();

  if (variant === 'compact') {
    return (
      <div className="alert alert-warning py-2 px-3 d-flex align-items-center gap-2 small">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span>{t.disclaimerCompact}</span>
      </div>
    );
  }

  return (
    <div className="alert alert-warning d-flex gap-3 align-items-start">
      <AlertTriangle size={24} className="flex-shrink-0 mt-1" />
      <div>
        <strong>{t.disclaimerTitle}</strong>
        <p className="mb-1 mt-1 small">
          {t.disclaimerBody1} <strong>{t.disclaimerNot}</strong> {t.disclaimerBody2}
        </p>
        <p className="mb-0 small text-muted">
          {t.disclaimerOcr}
        </p>
      </div>
    </div>
  );
}
