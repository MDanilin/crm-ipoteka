'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from '@/locales/ru';
import uz from '@/locales/uz';
import en from '@/locales/en';

function getStoredLang(): string {
  if (typeof window === 'undefined') return 'ru';
  return localStorage.getItem('crm-lang') || 'ru';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ru: { translation: ru },
      uz: { translation: uz },
      en: { translation: en },
    },
    lng: getStoredLang(),
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
  });
}

export function changeLang(lang: string) {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') localStorage.setItem('crm-lang', lang);
}

export default i18n;
