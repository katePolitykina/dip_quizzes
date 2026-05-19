import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './en';
import { ru } from './ru';
import type { Language, Messages } from './types';

const STORAGE_KEY = 'quizzly-language';

const dictionaries: Record<Language, Messages> = {
  en,
  ru,
};

function getInitialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ru') {
    return stored;
  }
  return window.navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

const I18nContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  messages: Messages;
} | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    messages: dictionaries[language],
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
