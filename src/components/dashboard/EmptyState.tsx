import React from 'react';
import { PackageOpen } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export const EmptyState: React.FC = () => {
  const { messages } = useI18n();
  return (
    <div className="card empty-dashed flex flex-col items-center justify-center rounded-[22px] px-4 py-16 text-center">
      <div className="glass-inset mb-5 flex h-20 w-20 items-center justify-center rounded-full text-[var(--color-indigo)]">
        <PackageOpen size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
        {messages.dashboard.noQuizzesYet}
      </h3>
      <p className="text-[var(--color-text-muted)] max-w-sm leading-relaxed">
        {messages.dashboard.createFirstQuiz}
      </p>
    </div>
  );
};
