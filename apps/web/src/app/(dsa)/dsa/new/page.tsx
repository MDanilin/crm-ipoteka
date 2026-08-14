'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface DupCheck {
  inn_duplicate:   { id: number; name: string; manager: string } | null;
  phone_duplicate: { id: number; name: string; manager: string } | null;
}

function useDebounced(value: string, ms: number) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

const PRODUCTS = ['Ипотека', 'Автокредит', 'Потребительский кредит', 'Бизнес-кредит', 'Депозит', 'РКО', 'Другое'];
const BRANCHES = ['Ташкент (ГО)', 'Самаркандский', 'Бухарский', 'Андижанский', 'Наманганский', 'Ферганский', 'Кашкадарьинский', 'Сурхандарьинский', 'Хорезмский', 'Навоийский', 'Джизакский', 'Сырдарьинский', 'Нукус'];

export default function DsaNewLeadPage() {
  const router = useRouter();
  const user   = useAuthStore(s => s.user);

  const [form, setForm] = useState({ name: '', inn: '', pinfl: '', contact: '', phone: '', product: '', branch: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dInn   = useDebounced(form.inn,   600);
  const dPhone = useDebounced(form.phone, 600);

  const { data: dupCheck } = useQuery<DupCheck>({
    queryKey: ['lead-check', dInn, dPhone],
    queryFn:  () => api.get(`/leads/check?inn=${encodeURIComponent(dInn)}&phone=${encodeURIComponent(dPhone)}`),
    enabled:  dInn.length >= 9 || dPhone.replace(/\D/g, '').length >= 9,
  });

  const create = useMutation({
    mutationFn: (body: typeof form & { agent_name: string; source: string }) =>
      api.post('/leads', body),
    onSuccess: () => router.replace('/dsa'),
  });

  const isDuplicate = !!(dupCheck?.inn_duplicate || dupCheck?.phone_duplicate);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name) e.name = 'Обязательное поле';
    const innD = form.inn.replace(/\D/g, '');
    if (!innD) e.inn = 'ИНН обязателен';
    else if (innD.length !== 9) e.inn = 'ИНН — 9 цифр';
    const pinflD = form.pinfl.replace(/\D/g, '');
    if (!pinflD) e.pinfl = 'ПИНФЛ обязателен';
    else if (pinflD.length !== 14) e.pinfl = 'ПИНФЛ — 14 цифр';
    const phoneD = form.phone.replace(/\D/g, '');
    if (!phoneD || phoneD === '998') e.phone = 'Телефон обязателен';
    else if (!phoneD.startsWith('998') || phoneD.length !== 12) e.phone = 'Формат: +998 XX XXX-XX-XX';
    if (!form.product) e.product = 'Выберите продукт';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    create.mutate({ ...form, agent_name: user?.name ?? '', source: 'dsa' });
  }

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const inputBase = 'w-full h-12 px-4 rounded-2xl border bg-white text-sm placeholder:text-[#ccc] focus:outline-none transition-colors';

  return (
    <div className="flex flex-col flex-1">

      {/* Header */}
      <header className="bg-white border-b border-[#f0f0f0] px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f3f3f3] text-[#111] active:scale-90 transition-transform text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-[-0.04em]">Новый лид</h1>
          <p className="text-xs text-[#aaa]">Заполните данные клиента</p>
        </div>
      </header>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ paddingBottom: '100px' }}>

        {isDuplicate && (
          <div className="rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-4">
            <p className="text-sm font-semibold text-[#991b1b] mb-1">⚠️ Лид уже существует</p>
            {dupCheck?.inn_duplicate && (
              <p className="text-xs text-[#b91c1c]">ИНН: «{dupCheck.inn_duplicate.name}» — ведёт {dupCheck.inn_duplicate.manager || 'менеджер'}</p>
            )}
            {dupCheck?.phone_duplicate && (
              <p className="text-xs text-[#b91c1c]">Тел.: «{dupCheck.phone_duplicate.name}» — ведёт {dupCheck.phone_duplicate.manager || 'менеджер'}</p>
            )}
            <p className="text-xs text-[#aaa] mt-2">Этот лид уже взят другим менеджером</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">Компания / ФИО *</label>
          <input
            value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(v => ({ ...v, name: '' })); }}
            placeholder="ООО «Название» или Имя Фамилия"
            className={`${inputBase} ${errors.name ? 'border-[#fca5a5]' : 'border-[#e5e5e5] focus:border-[#111]'}`}
          />
          {errors.name && <p className="mt-1 text-xs text-[#ef4444]">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">ИНН *</label>
          <div className="relative">
            <input
              value={form.inn}
              onChange={e => { setForm(p => ({ ...p, inn: e.target.value.replace(/\D/g, '').slice(0, 9) })); setErrors(v => ({ ...v, inn: '' })); }}
              inputMode="numeric" placeholder="123456789"
              className={`${inputBase} pr-16 ${dupCheck?.inn_duplicate || errors.inn ? 'border-[#fca5a5]' : 'border-[#e5e5e5] focus:border-[#111]'}`}
            />
            {dupCheck?.inn_duplicate && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ef4444] font-semibold">Дубль</span>
            )}
          </div>
          {errors.inn && <p className="mt-1 text-xs text-[#ef4444]">{errors.inn}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">ПИНФЛ *</label>
          <input
            value={form.pinfl}
            onChange={e => { setForm(p => ({ ...p, pinfl: e.target.value.replace(/\D/g, '').slice(0, 14) })); setErrors(v => ({ ...v, pinfl: '' })); }}
            inputMode="numeric" placeholder="12345678901234"
            className={`${inputBase} ${errors.pinfl ? 'border-[#fca5a5]' : 'border-[#e5e5e5] focus:border-[#111]'}`}
          />
          {errors.pinfl && <p className="mt-1 text-xs text-[#ef4444]">{errors.pinfl}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">Контактное лицо</label>
          <input
            value={form.contact} onChange={f('contact')}
            placeholder="Имя Фамилия"
            className={`${inputBase} border-[#e5e5e5] focus:border-[#111]`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">Телефон *</label>
          <div className="relative">
            <input
              value={form.phone}
              onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(v => ({ ...v, phone: '' })); }}
              inputMode="tel" placeholder="+998 90 000-00-00"
              className={`${inputBase} pr-16 ${dupCheck?.phone_duplicate || errors.phone ? 'border-[#fca5a5]' : 'border-[#e5e5e5] focus:border-[#111]'}`}
            />
            {dupCheck?.phone_duplicate && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ef4444] font-semibold">Дубль</span>
            )}
          </div>
          {errors.phone && <p className="mt-1 text-xs text-[#ef4444]">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">Продукт *</label>
          <select
            value={form.product}
            onChange={e => { setForm(p => ({ ...p, product: e.target.value })); setErrors(v => ({ ...v, product: '' })); }}
            className={`${inputBase} ${errors.product ? 'border-[#fca5a5]' : 'border-[#e5e5e5] focus:border-[#111]'} appearance-none`}
          >
            <option value="">Выберите продукт...</option>
            {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.product && <p className="mt-1 text-xs text-[#ef4444]">{errors.product}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5 uppercase tracking-wide">Филиал</label>
          <select
            value={form.branch} onChange={f('branch')}
            className={`${inputBase} border-[#e5e5e5] focus:border-[#111] appearance-none`}
          >
            <option value="">— выберите филиал —</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] p-4">
          <p className="text-xs font-semibold text-[#166534] mb-1">Автоназначение менеджера</p>
          <p className="text-xs text-[#86efac]">Менеджер будет назначен автоматически при создании лида</p>
        </div>

        <div className="rounded-2xl bg-[#f3f4f6] px-4 py-3">
          <p className="text-xs text-[#aaa]">Канал: <span className="text-[#555] font-medium">DSA</span></p>
          <p className="text-xs text-[#aaa] mt-0.5">Сотрудник: <span className="text-[#555] font-medium">{user?.name}</span></p>
        </div>
      </div>

      {/* Fixed submit */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-gradient-to-t from-[#f7f7f7] via-[#f7f7f7] to-transparent">
        <button
          onClick={handleSubmit}
          disabled={!form.name || !form.phone || create.isPending || isDuplicate}
          className="w-full h-14 rounded-2xl bg-[#111] text-white text-base font-semibold shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
        >
          {create.isPending ? 'Сохранение...' : 'Создать лид →'}
        </button>
        {create.isError && (
          <p className="text-center text-xs text-[#ef4444] mt-2">
            {(create.error as { error?: string })?.error ?? 'Ошибка сохранения'}
          </p>
        )}
      </div>
    </div>
  );
}
