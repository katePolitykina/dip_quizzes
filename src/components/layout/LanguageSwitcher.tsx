import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/types';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, messages } = useI18n();

  const options: Language[] = ['en', 'ru'];
  const isEditorScreen = typeof window !== 'undefined' && window.location.pathname === '/editor';

  return (
    <div
      className={`fixed right-4 z-[80] max-w-[calc(100vw-2rem)] ${
        isEditorScreen ? 'bottom-4' : 'top-4'
      }`}
    >
      <div className="card flex items-center gap-1 p-1.5" aria-label={messages.switcher.label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            className={`min-w-11 rounded-full px-3 py-2 text-xs font-extrabold transition-all ${
              language === option
                ? 'bg-[var(--color-midnight)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-white/70'
            }`}
          >
            {messages.languageNames[option]}
          </button>
        ))}
      </div>
    </div>
  );
};
