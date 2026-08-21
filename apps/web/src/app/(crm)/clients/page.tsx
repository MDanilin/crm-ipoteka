'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import type { Client } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

// Монохромная система статусов (см. components/ui/Badge.tsx) — цвет
// остаётся только у critical-состояний, остальное обычный текст.
const statusVariant: Record<string, 'green' | 'orange' | 'gray'> = {
  active:   'green',
  pending:  'orange',
  inactive: 'gray',
};
const statusL = { active:'Активный', pending:'На рассмотрении', inactive:'Неактивный' } as const;
const riskStyles: Record<string, string> = {
  low:    'bg-ok-bg text-ok',
  medium: 'bg-warn-bg text-warn',
  high:   'bg-dn-bg text-dn',
};
const riskL = { low:'Низкий', medium:'Средний', high:'Высокий' } as const;
const BRANCHES = ['Головной офис (Ташкент)', 'Самаркандский филиал', 'Бухарский филиал', 'Ферганский филиал', 'Андижанский филиал', 'Наманганский филиал', 'Нукусский филиал'];

export default function ClientsPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const { t }  = useTranslation();
  const [open, setOpen] = useState(false);
  // Тип/Сегмент/Филиал/Город начинаются пустыми — раньше select тихо
  // предвыбирал первый вариант (Крупный бизнес/Standard/Ташкент), и форма
  // проходила валидацию, даже если пользователь их вообще не трогал.
  const EMPTY_FORM = { name:'', type:'', industry:'', inn:'', pinfl:'', city:'', branch:'', phone:'', email:'', manager:'', segment:'', status:'active', risk_level:'low', rating:'', revenue:'', credit_limit:'', employees:'' };
  const CLIENT_TYPES = ['Малый бизнес', 'Средний бизнес', 'Крупный бизнес', 'Международные', 'Payroll', 'Private'];
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Только буквы/пробелы/дефис — для настоящих полей-имён (город, ФИО
  // менеджера), где цифры в принципе не могут быть частью значения.
  // Название и Отрасль оставлены свободными: реальные названия компаний
  // легитимно содержат цифры и символы («1С», «Silk Road 2.0» и т.п.).
  const onlyLetters = (v: string) => v.replace(/[^\p{L}\s-]/gu, '');
  const onlyDigits  = (v: string, max?: number) => { const d = v.replace(/\D/g, ''); return max ? d.slice(0, max) : d; };
  function formatUzPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    const d = digits.startsWith('998') ? digits : '998' + digits.replace(/^0+/, '');
    let out = '+998';
    if (d.length > 3) out += ' ' + d.slice(3, 5);
    if (d.length > 5) out += ' ' + d.slice(5, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    if (d.length > 10) out += '-' + d.slice(10, 12);
    return out;
  }

  // Обязательные поля: Название, Телефон, Город, Тип, Сегмент, Филиал,
  // и ИНН либо ПИНФЛ (хотя бы один из двух — юрлицо и физлицо-ИП
  // идентифицируются по-разному).
  function validateForm() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Название обязательно';
    if (!form.city.trim()) e.city = 'Город обязателен';
    if (!form.type) e.type = 'Выберите тип';
    if (!form.segment) e.segment = 'Выберите сегмент';
    if (!form.branch) e.branch = 'Выберите филиал';
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits === '998') e.phone = 'Телефон обязателен';
    else if (!phoneDigits.startsWith('998') || phoneDigits.length !== 12) e.phone = 'Формат: +998 XX XXX-XX-XX';
    if (!form.inn && !form.pinfl) e.inn = 'Укажите ИНН или ПИНФЛ';
    if (form.inn && form.inn.length !== 9) e.inn = 'ИНН — 9 цифр';
    if (form.pinfl && form.pinfl.length !== 14) e.pinfl = 'ПИНФЛ — 14 цифр';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  () => api.get('/clients'),
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post('/clients', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); setErrors({}); setForm({ ...EMPTY_FORM }); },
    onError: (err: unknown) => setErrors(v => ({ ...v, form: (err as { error?: string }).error ?? 'Ошибка создания клиента' })),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-g60 text-sm">{t('common.loading')}</div>;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('clients.title')}</h1>
          <p className="mt-4 text-base text-g60">{t('clients.subtitle')}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{t('clients.newBtn')}</Button>
      </div>

      {/* Count row */}
      <div className="mb-5 flex items-center justify-between border-y border-g20 py-4">
        <span className="text-sm font-semibold">{t('clients.total', { count: clients.length })}</span>
      </div>

      {/* Table — без принудительной общей min-width: колонки со свободным
          текстом (Отрасль/Менеджер) сжимаются через max-w+truncate,
          поэтому таблица помещается в экран без горизонтального скролла
          (см. Rocket Work — там его тоже нет). */}
      <div className="overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th className="min-w-[170px]">{t('clients.colClient')}</th>
              <th>{t('clients.colType')}</th>
              <th>{t('clients.colIndustry')}</th>
              <th>{t('clients.colManager')}</th>
              <th>{t('clients.colSegment')}</th>
              <th>{t('clients.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="cursor-pointer"
              >
                {/* Клиент — аватар + название + город */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-g10 text-xs font-bold text-g70">
                      {c.short_name || c.name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0 max-w-[150px]">
                      <p className="font-semibold text-sm leading-snug truncate" title={c.name}>{c.name}</p>
                      <p className="text-xs text-g60 mt-0.5 truncate">{c.city}</p>
                    </div>
                  </div>
                </td>
                {/* Тип — просто текст, не обрезать */}
                <td className="whitespace-nowrap">
                  <Badge variant="gray">{c.type}</Badge>
                </td>
                {/* Отрасль — текст с truncate + title */}
                <td className="max-w-[130px]">
                  <span className="block text-sm text-g80 truncate" title={c.industry || ''}>{c.industry || '—'}</span>
                </td>
                {/* Менеджер — текст с truncate + title */}
                <td className="max-w-[110px]">
                  <span className="block text-sm truncate" title={c.manager || ''}>{c.manager || '—'}</span>
                </td>
                {/* Сегмент — бейдж, не обрезать */}
                <td className="whitespace-nowrap">
                  <Badge variant={c.segment === 'Premium' ? 'purple' : 'gray'}>{c.segment}</Badge>
                </td>
                {/* Статус — бейдж, не обрезать */}
                <td className="whitespace-nowrap">
                  <Badge variant={statusVariant[c.status] ?? 'gray'}>{t(`common.status.${c.status}`)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={t('clients.formTitle')} onClose={() => { setOpen(false); setErrors({}); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setOpen(false); setErrors({}); }}>{t('common.cancel')}</Button>
          <Button onClick={() => { if (validateForm()) create.mutate(form); }} disabled={!form.name || create.isPending || !!errors.inn || !!errors.pinfl}>
            {create.isPending ? t('common.creating') : t('clients.createBtn')}
          </Button>
        </>}>
        {errors.form && <p className="mb-4 text-sm text-dn">{errors.form}</p>}
        <div className="space-y-4">
          <div>
            <label className="field-label">{t('clients.fName')}</label>
            <input
              value={form.name}
              onChange={e => { setForm({...form,name:e.target.value}); setErrors(v => ({ ...v, name: '' })); }}
              className={`form-input ${errors.name ? 'border border-dn' : ''}`}
              placeholder="ООО Пример"
            />
            {errors.name && <p className="mt-1 text-[11px] text-dn">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('clients.fType')} *</label>
              <select
                value={form.segment}
                onChange={e => { setForm({...form,segment:e.target.value}); setErrors(v => ({ ...v, segment: '' })); }}
                className={`form-input ${errors.segment ? 'border border-dn' : ''}`}
              >
                <option value="">— выберите —</option>
                <option>Standard</option><option>Premium</option>
              </select>
              {errors.segment && <p className="mt-1 text-[11px] text-dn">{errors.segment}</p>}
            </div>
            <div><label className="field-label">{t('clients.fIndustry')}</label><input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className="form-input" placeholder="Агропром, IT..."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('clients.fInn')}</label>
              <input
                value={form.inn}
                onChange={e => { setForm({ ...form, inn: onlyDigits(e.target.value, 9) }); setErrors(v => ({ ...v, inn: '' })); }}
                onBlur={e => { if (e.target.value.length > 0 && e.target.value.length !== 9) setErrors(v => ({ ...v, inn: 'ИНН — 9 цифр' })); }}
                className={`form-input ${errors.inn ? 'border border-dn' : ''}`}
                placeholder="123456789" inputMode="numeric"
              />
              {errors.inn && <p className="mt-1 text-[11px] text-dn">{errors.inn}</p>}
            </div>
            <div>
              <label className="field-label">ПИНФЛ</label>
              <input
                value={form.pinfl}
                onChange={e => { setForm({ ...form, pinfl: onlyDigits(e.target.value, 14) }); setErrors(v => ({ ...v, pinfl: '', inn: '' })); }}
                onBlur={e => { if (e.target.value.length > 0 && e.target.value.length !== 14) setErrors(v => ({ ...v, pinfl: 'ПИНФЛ — 14 цифр' })); }}
                className={`form-input ${errors.pinfl ? 'border border-dn' : ''}`}
                placeholder="12345678901234" inputMode="numeric"
              />
              {errors.pinfl && <p className="mt-1 text-[11px] text-dn">{errors.pinfl}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('clients.fCity')}</label>
              <input
                value={form.city}
                onChange={e => { setForm({...form,city:onlyLetters(e.target.value)}); setErrors(v => ({ ...v, city: '' })); }}
                className={`form-input ${errors.city ? 'border border-dn' : ''}`}
              />
              {errors.city && <p className="mt-1 text-[11px] text-dn">{errors.city}</p>}
            </div>
            <div>
              <label className="field-label">Филиал *</label>
              <select
                value={form.branch}
                onChange={e => { setForm({...form,branch:e.target.value}); setErrors(v => ({ ...v, branch: '' })); }}
                className={`form-input ${errors.branch ? 'border border-dn' : ''}`}
              >
                <option value="">— выберите —</option>
                {BRANCHES.map(b=><option key={b}>{b}</option>)}
              </select>
              {errors.branch && <p className="mt-1 text-[11px] text-dn">{errors.branch}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fPhone')}</label>
              <input
                value={form.phone}
                onChange={e => { setForm({...form,phone: formatUzPhone(e.target.value)}); setErrors(v => ({ ...v, phone: '' })); }}
                onFocus={e => { if (!e.target.value) setForm({ ...form, phone: '+998 ' }); }}
                className={`form-input ${errors.phone ? 'border border-dn' : ''}`} placeholder="+998 90 000-00-00" inputMode="tel"
              />
              {errors.phone && <p className="mt-1 text-[11px] text-dn">{errors.phone}</p>}
            </div>
            <div><label className="field-label">{t('clients.fEmail')}</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="form-input" placeholder="info@company.uz"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fManager')}</label><input value={form.manager} onChange={e=>setForm({...form,manager:onlyLetters(e.target.value)})} className="form-input" placeholder="Иванов И.И."/></div>
            <div>
              <label className="field-label">{t('clients.fSegment')} *</label>
              <select
                value={form.type}
                onChange={e => { setForm({...form,type:e.target.value}); setErrors(v => ({ ...v, type: '' })); }}
                className={`form-input ${errors.type ? 'border border-dn' : ''}`}
              >
                <option value="">— выберите —</option>
                {CLIENT_TYPES.map(v=><option key={v}>{v}</option>)}
              </select>
              {errors.type && <p className="mt-1 text-[11px] text-dn">{errors.type}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fStatus')}</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="form-input">
                <option value="active">{t('common.status.active')}</option>
                <option value="pending">{t('common.status.pending')}</option>
                <option value="inactive">{t('common.status.inactive')}</option>
              </select>
            </div>
            <div><label className="field-label">{t('clients.fRisk')}</label>
              <select value={form.risk_level} onChange={e=>setForm({...form,risk_level:e.target.value})} className="form-input">
                <option value="low">{t('common.risk.low')}</option>
                <option value="medium">{t('common.risk.medium')}</option>
                <option value="high">{t('common.risk.high')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fRating')}</label><input value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} className="form-input" placeholder="A+, A, B..."/></div>
            <div><label className="field-label">{t('clients.fEmployees')}</label><input value={form.employees} onChange={e=>setForm({...form,employees:onlyDigits(e.target.value)})} className="form-input" placeholder="500" inputMode="numeric"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fRevenue')}</label><input value={form.revenue} onChange={e=>setForm({...form,revenue:e.target.value})} className="form-input" placeholder="100 млрд UZS"/></div>
            <div><label className="field-label">{t('clients.fCreditLimit')}</label><input value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})} className="form-input" placeholder="10 млрд UZS"/></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
