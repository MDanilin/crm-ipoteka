'use client';

import { useState } from 'react';
import type { JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { ClientDetail, Contact, Document, Communication } from '@crm/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const statusV = { active: 'green', pending: 'orange', inactive: 'gray' } as const;
const statusL = { active: 'Активный', pending: 'На рассмотрении', inactive: 'Неактивный' } as const;
const riskV   = { low: 'green', medium: 'orange', high: 'red' } as const;
const riskL   = { low: 'Низкий', medium: 'Средний', high: 'Высокий' } as const;
const clientBg = { large: '#1d4ed8', sme: '#7c3aed', holding: '#0f766e', international: '#d97706' } as const;

const TABS = ['Продукты', 'Контакты', 'Задачи', 'Коммуникации', 'Документы'] as const;
type Tab = typeof TABS[number];

// ── SVG icon primitives ───────────────────────────────────────────────────────
function IconDoc()       { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 3h7l3 3v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconChart()     { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="10" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="8.5" y="6" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function IconClip()      { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="4" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconId()        { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 9h4M12 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconEdit()      { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 16l1.5-4L14 4l3 3-8.5 8.5L4 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconLock()      { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1.5" fill="currentColor"/></svg>; }
function IconPaperclip() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M16 9l-6.5 6.5a4.5 4.5 0 01-6.5-6.5l6.5-6.5a3 3 0 014 4l-6.5 6.5a1.5 1.5 0 01-2-2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconFile()      { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 3h7l3 3v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3v4h4M7 13h6M7 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconCall()      { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 011-1h3l1.5 4-2 1.5A11 11 0 0012.5 13l1.5-2 4 1.5v3a1 1 0 01-1 1A16 16 0 013 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconMail()      { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconMeeting()   { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 17c0-3 2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 12c2 0 4 1.5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }

// ── Meta info icons ───────────────────────────────────────────────────────────
function IcoIndustry() { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M2 18V9l5-3v3l5-3v3l4-2v11H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoPin()      { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function IcoPerson()   { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M3 19c0-4 3-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IcoGroup()    { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 18c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 13c2.5 0 5 1.5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IcoPhone()    { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 011-1h3l1.5 4-2 1.5A11 11 0 0012.5 13l1.5-2 4 1.5v3a1 1 0 01-1 1A16 16 0 013 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoMail()     { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IcoCoin()     { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v1m0 6v1M7.5 10c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5S11.4 12.5 10 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IcoBank()     { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M2 8l8-5 8 5H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 8v7M8 8v7M12 8v7M16 8v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M1 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IcoInn()      { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8h8M6 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }

const DOC_TYPES = [
  { key: 'doc',    label: 'Документ',        Icon: IconDoc },
  { key: 'chart',  label: 'Отчёт / финансы', Icon: IconChart },
  { key: 'clip',   label: 'Договор',         Icon: IconClip },
  { key: 'id',     label: 'KYC / анкета',    Icon: IconId },
  { key: 'note',   label: 'Протокол',        Icon: IconEdit },
  { key: 'lock',   label: 'Конфиденц.',      Icon: IconLock },
  { key: 'attach', label: 'Приложение',      Icon: IconPaperclip },
  { key: 'other',  label: 'Прочее',          Icon: IconFile },
];

const DOC_ICON_MAP: Record<string, () => JSX.Element> = {
  doc: IconDoc, chart: IconChart, clip: IconClip, id: IconId,
  note: IconEdit, lock: IconLock, attach: IconPaperclip, other: IconFile,
};

function DocIcon({ icon }: { icon: string }) {
  const C = DOC_ICON_MAP[icon];
  if (C) return <span className="text-[#666]"><C /></span>;
  return <span className="text-base">{icon}</span>;
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#333] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#999] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full h-11 rounded-xl bg-[#f5f5f5] px-4 text-sm outline-none placeholder:text-[#bbb] focus:bg-[#efefef] transition-colors" />;
}

function ModalActions({ onCancel, onSubmit, pending, label }: { onCancel: () => void; onSubmit: () => void; pending: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-[#e5e7eb] text-sm font-medium text-[#555] hover:bg-[#f9fafb] transition-colors">Отмена</button>
      <button onClick={onSubmit} disabled={pending} className="flex-1 h-11 rounded-xl bg-[#111] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-40 transition-colors">
        {pending ? 'Сохранение...' : label}
      </button>
    </div>
  );
}

// ── Add Contact ───────────────────────────────────────────────────────────────
function AddContactModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', is_primary: false });
  const [error, setError] = useState('');
  const mut = useMutation({
    mutationFn: (d: typeof form) => api.post(`/clients/${clientId}/contacts`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', clientId] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });
  const set = (k: keyof typeof form, v: string | boolean) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  return (
    <Modal title="Добавить контакт" onClose={onClose}>
      <div className="space-y-4">
        <Field label="ФИО *"><Input placeholder="Иванов Иван Иванович" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Должность"><Input placeholder="Директор по финансам" value={form.role} onChange={e => set('role', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Телефон"><Input placeholder="+998 90 000-00-00" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input placeholder="name@company.uz" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div onClick={() => set('is_primary', !form.is_primary)} className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0', form.is_primary ? 'bg-[#111] border-[#111]' : 'border-[#ddd]')}>
            {form.is_primary && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          </div>
          <span className="text-sm text-[#555]">Основной контакт</span>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onCancel={onClose} pending={mut.isPending} label="Добавить"
          onSubmit={() => { if (!form.name.trim()) { setError('Введите ФИО'); return; } mut.mutate(form); }} />
      </div>
    </Modal>
  );
}

// ── Add Product ───────────────────────────────────────────────────────────────
interface CatalogItem { id: number; name: string; category: string; description: string; }

function AddProductModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', number: '', limit_val: '', used_val: '', rate: '', expires: '', status: 'active' });
  const [error, setError] = useState('');

  const { data: catalog = [] } = useQuery<CatalogItem[]>({
    queryKey: ['product-catalog'],
    queryFn:  () => api.get('/product-catalog'),
  });

  const byCategory = catalog.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    const cat = item.category || 'Прочее';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const mut = useMutation({
    mutationFn: (d: typeof form) => api.post(`/clients/${clientId}/products`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', clientId] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  const STATUS_OPTS = [{ v: 'active', label: 'Активный' }, { v: 'pending', label: 'На рассмотрении' }, { v: 'expired', label: 'Истёк' }];

  return (
    <Modal title="Добавить продукт" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Продукт *">
          <select
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full h-11 rounded-xl bg-[#f5f5f5] px-4 text-sm outline-none appearance-none cursor-pointer"
          >
            <option value="">— Выберите из каталога —</option>
            {Object.entries(byCategory).map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map(item => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {form.name && catalog.find(c => c.name === form.name)?.description && (
            <p className="text-[11px] text-[#aaa] mt-1">{catalog.find(c => c.name === form.name)?.description}</p>
          )}
        </Field>
        <Field label="Номер договора"><Input placeholder="КЛ-2026-001" value={form.number} onChange={e => set('number', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Лимит"><Input placeholder="10 млрд UZS" value={form.limit_val} onChange={e => set('limit_val', e.target.value)} /></Field>
          <Field label="Использовано"><Input placeholder="3.2 млрд UZS" value={form.used_val} onChange={e => set('used_val', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ставка"><Input placeholder="18% годовых" value={form.rate} onChange={e => set('rate', e.target.value)} /></Field>
          <Field label="Истекает"><Input placeholder="31.12.2026" value={form.expires} onChange={e => set('expires', e.target.value)} /></Field>
        </div>
        <Field label="Статус">
          <div className="flex gap-2">
            {STATUS_OPTS.map(o => (
              <button key={o.v} onClick={() => set('status', o.v)}
                className={cn('flex-1 h-10 rounded-xl border text-sm font-medium transition-colors',
                  form.status === o.v ? 'bg-[#111] text-white border-[#111]' : 'border-[#e5e7eb] text-[#555] hover:border-[#999]')}>
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onCancel={onClose} pending={mut.isPending} label="Добавить"
          onSubmit={() => { if (!form.name) { setError('Выберите продукт из каталога'); return; } mut.mutate(form); }} />
      </div>
    </Modal>
  );
}

// ── Add Communication ─────────────────────────────────────────────────────────
function AddCommModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toLocaleDateString('ru-RU');
  const [form, setForm] = useState({ type: 'call', date: today, summary: '', contact: '', duration: '', result: '' });
  const [error, setError] = useState('');
  const mut = useMutation({
    mutationFn: (d: typeof form) => api.post(`/clients/${clientId}/comms`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', clientId] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  const TYPE_OPTS = [
    { v: 'call',    label: 'Звонок',  Icon: IconCall },
    { v: 'email',   label: 'Email',   Icon: IconMail },
    { v: 'meeting', label: 'Встреча', Icon: IconMeeting },
  ];
  return (
    <Modal title="Добавить коммуникацию" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Тип">
          <div className="flex gap-2">
            {TYPE_OPTS.map(o => (
              <button key={o.v} onClick={() => set('type', o.v)}
                className={cn('flex-1 h-11 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                  form.type === o.v ? 'bg-[#111] text-white border-[#111]' : 'border-[#e5e7eb] text-[#555] hover:border-[#999]')}>
                <o.Icon />{o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Описание / итог *">
          <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
            placeholder="Обсудили условия кредитной линии..." rows={3}
            className="w-full rounded-xl bg-[#f5f5f5] px-4 py-3 text-sm outline-none placeholder:text-[#bbb] focus:bg-[#efefef] transition-colors resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Контакт"><Input placeholder="Иванов И.И." value={form.contact} onChange={e => set('contact', e.target.value)} /></Field>
          <Field label="Длительность"><Input placeholder="15 мин" value={form.duration} onChange={e => set('duration', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата"><Input placeholder={today} value={form.date} onChange={e => set('date', e.target.value)} /></Field>
          <Field label="Результат"><Input placeholder="Назначена встреча" value={form.result} onChange={e => set('result', e.target.value)} /></Field>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onCancel={onClose} pending={mut.isPending} label="Добавить"
          onSubmit={() => { if (!form.summary.trim()) { setError('Заполните описание'); return; } mut.mutate(form); }} />
      </div>
    </Modal>
  );
}

// ── Add Task ──────────────────────────────────────────────────────────────────
function AddTaskModal({ clientId, clientName, onClose }: { clientId: string; clientName: string; onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toLocaleDateString('ru-RU');
  const [form, setForm] = useState({ title: '', type: 'call', priority: 'medium', due: today, comment: '' });
  const [error, setError] = useState('');
  const mut = useMutation({
    mutationFn: (d: typeof form) => api.post('/tasks', { ...d, client_id: Number(clientId), client_name: clientName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', clientId] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const TYPE_OPTS = [
    { v: 'call',     label: 'Звонок' },
    { v: 'meeting',  label: 'Встреча' },
    { v: 'proposal', label: 'КП' },
    { v: 'document', label: 'Документ' },
    { v: 'analysis', label: 'Анализ' },
  ];
  const PRIO_OPTS = [
    { v: 'high',   label: 'Высокий', color: 'border-red-400 text-red-600' },
    { v: 'medium', label: 'Средний', color: 'border-orange-400 text-orange-600' },
    { v: 'low',    label: 'Низкий',  color: 'border-gray-400 text-gray-500' },
  ];

  return (
    <Modal title="Добавить задачу" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Задача *"><Input placeholder="Подготовить КП по кредитной линии" value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label="Тип">
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_OPTS.map(o => (
              <button key={o.v} onClick={() => set('type', o.v)}
                className={cn('h-9 px-3 rounded-lg border text-sm font-medium transition-colors',
                  form.type === o.v ? 'bg-[#111] text-white border-[#111]' : 'border-[#e5e7eb] text-[#555] hover:border-[#999]')}>
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Приоритет">
          <div className="flex gap-2">
            {PRIO_OPTS.map(o => (
              <button key={o.v} onClick={() => set('priority', o.v)}
                className={cn('flex-1 h-10 rounded-xl border-2 text-sm font-semibold transition-colors',
                  form.priority === o.v ? o.color + ' bg-opacity-10' : 'border-[#e5e7eb] text-[#aaa] hover:border-[#ccc]')}>
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Срок"><Input placeholder="31.08.2026" value={form.due} onChange={e => set('due', e.target.value)} /></Field>
        <Field label="Комментарий">
          <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
            placeholder="Дополнительные детали..." rows={2}
            className="w-full rounded-xl bg-[#f5f5f5] px-4 py-3 text-sm outline-none placeholder:text-[#bbb] focus:bg-[#efefef] transition-colors resize-none" />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onCancel={onClose} pending={mut.isPending} label="Добавить"
          onSubmit={() => { if (!form.title.trim()) { setError('Введите название задачи'); return; } mut.mutate(form); }} />
      </div>
    </Modal>
  );
}

// ── Add Document ──────────────────────────────────────────────────────────────
function AddDocumentModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toLocaleDateString('ru-RU');
  const [form, setForm] = useState({ name: '', icon: 'doc', date: today, size: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: (d: typeof form) => api.post(`/clients/${clientId}/documents`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', clientId] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!form.name) setForm(prev => ({ ...prev, name: f.name.replace(/\.[^/.]+$/, '') }));
    const mb = (f.size / (1024 * 1024)).toFixed(1);
    setForm(prev => ({ ...prev, size: mb + ' MB' }));
    setError('');
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Введите название'); return; }
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file, form.name + (file.name.match(/\.[^/.]+$/) ?? [''])[0]);
        const token = localStorage.getItem('crm_token');
        const res = await fetch(`http://localhost:3001/api/clients/${clientId}/documents/upload`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (!res.ok) throw new Error('Ошибка загрузки');
        qc.invalidateQueries({ queryKey: ['client', clientId] });
        onClose();
      } catch (err) {
        setError((err as Error).message);
      } finally { setUploading(false); }
    } else {
      mut.mutate(form);
    }
  }

  return (
    <Modal title="Добавить документ" onClose={onClose}>
      <div className="space-y-4">
        {/* File upload zone */}
        <label className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-[#e5e7eb] cursor-pointer hover:border-[#999] hover:bg-[#fafafa] transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#aaa]">
            <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {file
            ? <span className="text-sm font-medium text-[#111]">{file.name}</span>
            : <span className="text-sm text-[#aaa]">Нажмите чтобы выбрать файл</span>
          }
          <input type="file" className="hidden" onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar" />
        </label>

        <Field label="Название *"><Input placeholder="Договор об обслуживании №123" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Тип документа">
          <div className="grid grid-cols-4 gap-2">
            {DOC_TYPES.map(t => (
              <button key={t.key} onClick={() => set('icon', t.key)} title={t.label}
                className={cn('h-11 rounded-xl flex items-center justify-center transition-colors border',
                  form.icon === t.key ? 'border-[#111] bg-[#f5f5f5] text-[#111]' : 'border-[#eee] text-[#999] hover:border-[#ccc] hover:text-[#555]')}>
                <t.Icon />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#aaa] mt-1.5">{DOC_TYPES.find(t => t.key === form.icon)?.label}</p>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата"><Input placeholder="01.01.2026" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
          <Field label="Размер"><Input placeholder="1.2 MB" value={form.size} readOnly={!!file} onChange={e => set('size', e.target.value)} /></Field>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onCancel={onClose} pending={mut.isPending || uploading} label={uploading ? 'Загрузка...' : 'Добавить'} onSubmit={handleSubmit} />
      </div>
    </Modal>
  );
}

// ── Small reusable UI ─────────────────────────────────────────────────────────
function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-500 transition-all flex-shrink-0" title="Удалить">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M3.5 3.5l8 8M11.5 3.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111] text-white text-sm font-medium hover:bg-[#333] transition-colors">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-gray-400">{text}</div>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const qc      = useQueryClient();
  const [tab, setTab]   = useState<Tab>('Продукты');
  const [modal, setModal] = useState<'contact' | 'product' | 'comm' | 'doc' | 'task' | 'edit' | null>(null);

  const updateClient = useMutation({
    mutationFn: (body: Record<string, string>) => api.put(`/clients/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', id] }); qc.invalidateQueries({ queryKey: ['clients'] }); setModal(null); },
  });

  const { data: c, isLoading } = useQuery<ClientDetail>({
    queryKey: ['client', id],
    queryFn:  () => api.get(`/clients/${id}`),
  });

  const delContact = useMutation({ mutationFn: (cid: number) => api.delete(`/clients/${id}/contacts/${cid}`),  onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }) });
  const delDoc     = useMutation({ mutationFn: (did: number) => api.delete(`/clients/${id}/documents/${did}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }) });
  const delProduct = useMutation({ mutationFn: (pid: number) => api.delete(`/clients/${id}/products/${pid}`),  onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }) });
  const delComm    = useMutation({ mutationFn: (cid: number) => api.delete(`/clients/${id}/comms/${cid}`),     onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }) });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Загрузка...</div>;
  if (!c) return <div className="text-center py-20 text-gray-400">Клиент не найден</div>;

  return (
    <div>
      {modal === 'contact' && <AddContactModal  clientId={id} onClose={() => setModal(null)} />}
      {modal === 'product' && <AddProductModal  clientId={id} onClose={() => setModal(null)} />}
      {modal === 'comm'    && <AddCommModal     clientId={id} onClose={() => setModal(null)} />}
      {modal === 'doc'     && <AddDocumentModal clientId={id} onClose={() => setModal(null)} />}
      {modal === 'task'    && <AddTaskModal     clientId={id} clientName={c.name} onClose={() => setModal(null)} />}
      {modal === 'edit'    && <EditClientModal  client={c} onClose={() => setModal(null)} onSave={updateClient.mutate} pending={updateClient.isPending} />}

      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>← Все клиенты</Button>
      </div>

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 flex items-start gap-5">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 tracking-tight"
          style={{ background: clientBg[c.type_en as keyof typeof clientBg] ?? '#1d4ed8' }}>
          {c.short_name || c.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setModal('edit')}
            className="float-right ml-4 flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e5e7eb] text-xs font-medium text-[#555] hover:border-[#999] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 16l1.5-4L14 4l3 3-8.5 8.5L4 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 6l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            Редактировать
          </button>
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <h2 className="text-xl font-extrabold tracking-tight">{c.name}</h2>
            <Badge variant={statusV[c.status as keyof typeof statusV]}>{statusL[c.status as keyof typeof statusL]}</Badge>
            <Badge variant={riskV[c.risk_level as keyof typeof riskV]}>{riskL[c.risk_level as keyof typeof riskL]}</Badge>
            {c.rating && <Badge variant="purple">{c.rating}</Badge>}
            {c.segment === 'Premium' && <Badge variant="purple">Premium</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {c.industry  && <span className="flex items-center gap-1"><IcoIndustry/>{c.industry}</span>}
            {c.city      && <span className="flex items-center gap-1"><IcoPin/>{c.city}</span>}
            {c.manager   && <span className="flex items-center gap-1"><IcoPerson/>{c.manager}</span>}
            {c.inn       && <span className="flex items-center gap-1"><IcoInn/>ИНН: {c.inn}</span>}
            {c.employees && <span className="flex items-center gap-1"><IcoGroup/>{c.employees} чел.</span>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
            {c.phone        && <span className="flex items-center gap-1"><IcoPhone/>{c.phone}</span>}
            {c.email        && <span className="flex items-center gap-1"><IcoMail/>{c.email}</span>}
            {c.revenue      && <span className="flex items-center gap-1"><IcoCoin/>Выручка: {c.revenue}</span>}
            {c.credit_limit && <span className="flex items-center gap-1"><IcoBank/>Лимит: {c.credit_limit}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-gray-200 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t ? 'text-[#1d4ed8] border-[#1d4ed8] font-semibold' : 'text-gray-500 border-transparent hover:text-gray-900')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Продукты ── */}
      {tab === 'Продукты' && (
        <div>
          <div className="flex justify-end mb-4">
            <AddBtn onClick={() => setModal('product')}>Добавить продукт</AddBtn>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.products.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3"><Empty text="Нет продуктов — добавьте первый" /></div>
            ) : c.products.map((p: any) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 group relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { if (confirm('Удалить продукт?')) delProduct.mutate(p.id); }}
                    className="text-[#ccc] hover:text-red-500 transition-colors" title="Удалить">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3.5 3.5l8 8M11.5 3.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between mb-1 pr-5">
                  <div className="text-sm font-bold">{p.name}</div>
                  <Badge variant={p.status === 'active' ? 'green' : p.status === 'expired' ? 'red' : 'gray'}>
                    {p.status === 'active' ? 'Активный' : p.status === 'expired' ? 'Истёк' : 'На рассмотрении'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 mb-3">{p.number}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {([['Лимит', p.limit_val], ['Использовано', p.used_val], ['Ставка', p.rate], ['Истекает', p.expires]] as [string, string][]).map(([l, v]) => (
                    <div key={l}><div className="text-gray-400">{l}</div><div className="font-semibold text-gray-700">{v}</div></div>
                  ))}
                </div>
                {p.usage_pct > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${p.usage_pct}%`, background: p.usage_pct > 80 ? '#dc2626' : p.usage_pct > 60 ? '#d97706' : '#1d4ed8' }} />
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">Использовано {p.usage_pct}%</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Контакты ── */}
      {tab === 'Контакты' && (
        <div>
          <div className="flex justify-end mb-4">
            <AddBtn onClick={() => setModal('contact')}>Добавить контакт</AddBtn>
          </div>
          <div className="space-y-3">
            {c.contacts.length === 0 ? <Empty text="Нет контактов — добавьте первый" /> : c.contacts.map((ct: Contact) => (
              <div key={ct.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-[#1d4ed8] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {ct.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{ct.name}</div>
                    {ct.is_primary === 1 && <Badge variant="blue">Основной</Badge>}
                  </div>
                  <div className="text-xs text-gray-400">{ct.role}</div>
                </div>
                <div className="text-right text-sm">
                  {ct.phone && <div>{ct.phone}</div>}
                  {ct.email && <div className="text-gray-400 text-xs">{ct.email}</div>}
                </div>
                <DelBtn onClick={() => { if (confirm('Удалить контакт?')) delContact.mutate(ct.id); }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Задачи ── */}
      {tab === 'Задачи' && (
        <div>
          <div className="flex justify-end mb-4">
            <AddBtn onClick={() => setModal('task')}>Добавить задачу</AddBtn>
          </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {c.tasks.length === 0 ? <Empty text="Нет задач — добавьте первую" /> : c.tasks.map((t: any) => (
            <div key={t.id} className={cn('flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0', t.done && 'opacity-50')}>
              <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center', t.done ? 'bg-green-500 border-green-500' : 'border-gray-300')}>
                {!!t.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <div className="flex-1 text-sm font-medium">{t.title}</div>
              <div className="text-xs text-gray-400">{t.due}</div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* ── Коммуникации ── */}
      {tab === 'Коммуникации' && (
        <div>
          <div className="flex justify-end mb-4">
            <AddBtn onClick={() => setModal('comm')}>Добавить коммуникацию</AddBtn>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {c.comms.length === 0 ? <Empty text="Нет коммуникаций — добавьте первую" /> : c.comms.map((cm: Communication) => (
              <div key={cm.id} className="flex gap-3 px-5 py-4 group">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  cm.type === 'call' ? 'bg-blue-100 text-blue-600' : cm.type === 'email' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600')}>
                  {cm.type === 'call' ? <IconCall /> : cm.type === 'email' ? <IconMail /> : <IconMeeting />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <div className="text-sm font-semibold">{cm.type === 'call' ? 'Звонок' : cm.type === 'email' ? 'Email' : 'Встреча'}</div>
                    <div className="text-xs text-gray-400">{cm.date}</div>
                    {cm.manager && <div className="text-xs text-gray-400">· {cm.manager}</div>}
                  </div>
                  <div className="text-sm text-gray-700">{cm.summary}</div>
                  {(cm.contact || (cm.duration && cm.duration !== '—')) && (
                    <div className="text-xs text-gray-400 mt-1">{[cm.contact, cm.duration !== '—' ? cm.duration : ''].filter(Boolean).join(' · ')}</div>
                  )}
                  {cm.result && <div className="text-xs text-green-600 mt-1">→ {cm.result}</div>}
                </div>
                <DelBtn onClick={() => { if (confirm('Удалить запись?')) delComm.mutate(cm.id); }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Документы ── */}
      {tab === 'Документы' && (
        <div>
          <div className="flex justify-end mb-4">
            <AddBtn onClick={() => setModal('doc')}>Добавить документ</AddBtn>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {c.docs.length === 0 ? <Empty text="Нет документов — добавьте первый" /> : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Документ', 'Дата', 'Размер', ''].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.docs.map((d: Document) => (
                    <tr key={d.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 group">
                      <td className="px-5 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-[#555]">
                          <DocIcon icon={d.icon} />
                          {d.file_url
                            ? <a href={`http://localhost:3001${d.file_url}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#1d4ed8]">{d.name}</a>
                            : d.name
                          }
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{d.date}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{d.size}</td>
                      <td className="px-5 py-3 text-right">
                        <DelBtn onClick={() => { if (confirm('Удалить документ?')) delDoc.mutate(d.id); }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Client Modal ─────────────────────────────────────────────────────────
function EditClientModal({ client, onClose, onSave, pending }: {
  client: ClientDetail;
  onClose: () => void;
  onSave: (d: Record<string, string>) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    name:         client.name         ?? '',
    type:         client.type         ?? 'Крупный бизнес',
    industry:     client.industry     ?? '',
    inn:          client.inn          ?? '',
    city:         client.city         ?? '',
    phone:        client.phone        ?? '',
    email:        client.email        ?? '',
    manager:      client.manager      ?? '',
    segment:      client.segment      ?? 'Standard',
    status:       client.status       ?? 'active',
    risk_level:   client.risk_level   ?? 'low',
    rating:       client.rating       ?? '',
    employees:    client.employees    ?? '',
    revenue:      client.revenue      ?? '',
    credit_limit: client.credit_limit ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title="Редактировать клиента" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Название *"><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ООО Пример" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Тип">
            <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full h-11 rounded-xl bg-[#f5f5f5] px-4 text-sm outline-none appearance-none cursor-pointer">
              {['Крупный бизнес','МСП','Холдинг','Международные'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Отрасль"><Input value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="Агропром, IT..." /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ИНН"><Input value={form.inn} onChange={e => set('inn', e.target.value)} /></Field>
          <Field label="Город"><Input value={form.city} onChange={e => set('city', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Телефон"><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input value={form.email} onChange={e => set('email', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Менеджер"><Input value={form.manager} onChange={e => set('manager', e.target.value)} /></Field>
          <Field label="Статус">
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full h-11 rounded-xl bg-[#f5f5f5] px-4 text-sm outline-none appearance-none cursor-pointer">
              <option value="active">Активный</option>
              <option value="pending">На рассмотрении</option>
              <option value="inactive">Неактивный</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Сегмент">
            <select value={form.segment} onChange={e => set('segment', e.target.value)} className="w-full h-11 rounded-xl bg-[#f5f5f5] px-4 text-sm outline-none appearance-none cursor-pointer">
              <option>Standard</option><option>Premium</option>
            </select>
          </Field>
          <Field label="Уровень риска">
            <select value={form.risk_level} onChange={e => set('risk_level', e.target.value)} className="w-full h-11 rounded-xl bg-[#f5f5f5] px-4 text-sm outline-none appearance-none cursor-pointer">
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Рейтинг"><Input value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="A+, A, B..." /></Field>
          <Field label="Сотрудники"><Input value={form.employees} onChange={e => set('employees', e.target.value)} placeholder="500 чел." /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Выручка"><Input value={form.revenue} onChange={e => set('revenue', e.target.value)} placeholder="100 млрд UZS" /></Field>
          <Field label="Кредитный лимит"><Input value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} placeholder="10 млрд UZS" /></Field>
        </div>
        <ModalActions onCancel={onClose} onSubmit={() => form.name.trim() && onSave(form)} pending={pending} label="Сохранить" />
      </div>
    </Modal>
  );
}
