'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface Settings {
  bank_name:  string;
  bank_short: string;
  sla_hours:  string;
  city:       string;
}

export default function SettingsPage() {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();
  const { t }  = useTranslation();
  const qc     = useQueryClient();

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn:  () => api.get('/settings'),
  });

  const [form, setForm]     = useState<Partial<Settings>>({});
  const [saved, setSaved]   = useState(false);

  const mut = useMutation({
    mutationFn: (body: Partial<Settings>) => api.put<Settings>('/settings', body),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated);
      setForm({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 flex size-[52px] items-center justify-center rounded-[14px] bg-g10 border border-g20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aeb6c2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 className="text-base font-semibold tracking-[-0.03em] mb-1.5">Нет доступа</h2>
        <p className="text-[13px] text-g60">Раздел доступен только администратору</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-64 text-g60 text-sm">Загрузка...</div>;
  }

  const val = (key: keyof Settings) =>
    (form[key] !== undefined ? form[key] : data[key]) ?? '';

  function handleChange(key: keyof Settings, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const dirty = Object.keys(form).length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">
            {t('settings.title')}
          </h1>
          <p className="mt-4 text-base text-g60">{t('settings.subtitle')}</p>
        </div>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-ok-border bg-ok-bg px-5 py-3 text-sm font-medium text-ok">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/>
          </svg>
          {t('settings.saved')}
        </div>
      )}

      <div className="space-y-6 max-w-[640px]">

        {/* Bank info */}
        <div className="rounded-2xl border border-g20 p-6">
          <h2 className="text-base font-semibold tracking-[-0.02em] mb-5">{t('settings.sectionBank')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">{t('settings.bankName')}</label>
              <input
                className="form-input"
                value={val('bank_name')}
                onChange={e => handleChange('bank_name', e.target.value)}
                placeholder="Ипотека Банк"
              />
            </div>
            <div>
              <label className="field-label">{t('settings.bankShort')}</label>
              <input
                className="form-input"
                value={val('bank_short')}
                onChange={e => handleChange('bank_short', e.target.value)}
                placeholder="ИБ"
                maxLength={6}
              />
            </div>
            <div>
              <label className="field-label">{t('settings.city')}</label>
              <input
                className="form-input"
                value={val('city')}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="Ташкент"
              />
            </div>
          </div>
        </div>

        {/* SLA */}
        <div className="rounded-2xl border border-g20 p-6">
          <h2 className="text-base font-semibold tracking-[-0.02em] mb-1">{t('settings.sectionSla')}</h2>
          <p className="text-[13px] text-g60 mb-5">{t('settings.slaDesc')}</p>
          <div className="flex items-end gap-4">
            <div className="w-40">
              <label className="field-label">{t('settings.slaHours')}</label>
              <input
                type="number"
                min={1}
                max={72}
                className="form-input"
                value={val('sla_hours')}
                onChange={e => handleChange('sla_hours', e.target.value)}
              />
            </div>
            <p className="text-sm text-g60 pb-3">{t('settings.slaUnit')}</p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => mut.mutate(form)}
            disabled={!dirty || mut.isPending}
            className="flex h-11 items-center gap-2 rounded-full bg-g90 px-6 text-sm font-semibold text-white transition-colors hover:bg-g80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mut.isPending ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" strokeOpacity=".25"/><path d="M12 3a9 9 0 019 9" strokeLinecap="round"/>
                </svg>
                {t('settings.saving')}
              </>
            ) : t('settings.save')}
          </button>
          {dirty && (
            <button
              onClick={() => setForm({})}
              className="h-11 rounded-full border border-g30 px-5 text-sm font-medium text-g80 hover:bg-g5 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
