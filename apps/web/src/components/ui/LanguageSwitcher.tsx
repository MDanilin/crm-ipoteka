'use client';

import { useTranslation } from 'react-i18next';
import { changeLang } from '@/lib/i18n';

const LANGS = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-g10 rounded-full p-1">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          className={`h-7 px-3 rounded-full text-xs font-bold transition-all ${
            i18n.language === l.code
              ? 'bg-g90 text-white'
              : 'text-g70 hover:text-g90'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
