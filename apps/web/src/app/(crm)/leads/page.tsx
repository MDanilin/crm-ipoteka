'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Lead } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function useDebounced(value: string, ms: number) {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return dv;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  new:            { label: 'Новый',             color: 'bg-[#dbeafe] text-[#1d4ed8]' },
  in_progress:    { label: 'В работе',          color: 'bg-[#fef9c3] text-[#854d0e]' },
  meeting:        { label: 'Встреча назначена', color: 'bg-[#fde7d0] text-[#9a3412]' },
  account_opened: { label: 'Открыт счёт',      color: 'bg-[#dcfce7] text-[#166534]' },
  qualified:      { label: 'Квалифицирован',    color: 'bg-[#dcfce7] text-[#15803d]' },
  proposal:       { label: 'Предложение',       color: 'bg-[#f3f4f6] text-[#374151]' },
  converted:      { label: 'Конвертирован',     color: 'bg-[#ede9fe] text-[#6d28d9]' },
  lost:           { label: 'Потерян',           color: 'bg-[#fee2e2] text-[#991b1b]' },
};

const SRC_LABELS: Record<string, string> = {
  inbound: 'Входящий', website: 'Сайт', referral: 'Реферал',
  cold: 'Холодный', event: 'Мероприятие', branch: 'Филиал', agent: 'Агент',
};

// The 4-stage scenario flow shown in the timeline
const SCENARIO_STAGES = ['new', 'in_progress', 'meeting', 'account_opened'] as const;

function fmtTs(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function StageLine({ raw }: { raw: string }) {
  const times: Record<string, string> = (() => {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  })();

  return (
    <div className="flex items-start gap-0 py-3 px-2">
      {SCENARIO_STAGES.map((s, i) => {
        const ts = times[s];
        const done = !!ts;
        const active = done && !times[SCENARIO_STAGES[i + 1] as string];
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center min-w-[100px]">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${done ? 'bg-[#111]' : 'bg-[#ddd]'} ${active ? 'ring-2 ring-[#111]/20 ring-offset-1' : ''}`}/>
              <div className={`text-[11px] mt-1.5 text-center font-medium leading-tight ${done ? 'text-[#111]' : 'text-[#bbb]'}`}>
                {STATUS_CFG[s]?.label}
              </div>
              {ts
                ? <div className="text-[10px] text-[#888] mt-0.5">{fmtTs(ts)}</div>
                : <div className="text-[10px] text-[#ccc] mt-0.5">—</div>
              }
            </div>
            {i < SCENARIO_STAGES.length - 1 && (
              <div className={`h-px w-8 mx-1 mt-[-18px] flex-shrink-0 transition-colors ${done && times[SCENARIO_STAGES[i + 1] as string] ? 'bg-[#111]' : 'bg-[#e5e5e5]'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CatalogItem { id: number; name: string; category: string; is_active: number; }

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

const EMPTY_FORM = { name: '', contact: '', phone: '+998 ', inn: '', pinfl: '', product: '', amount: '', source: 'inbound', branch: '', agent_name: '', status: 'new', manager: '' };

export default function LeadsPage() {
  const router     = useRouter();
  const user       = useAuthStore(s => s.user);
  const isAgent    = user?.role === 'agent';
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';
  const dragging   = useRef(false);
  const { t }      = useTranslation();
  const qc         = useQueryClient();
  const [view,       setView]       = useState<'list' | 'board'>('list');
  const [open,       setOpen]       = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dupError,   setDupError]   = useState<string | null>(null);
  const [dupLeadId,  setDupLeadId]  = useState<number | null>(null);
  const [arbOpen,    setArbOpen]    = useState(false);
  const [arbComment, setArbComment] = useState('');
  const [reviewId,   setReviewId]   = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    manager:    user?.name ?? '',
    source:     isAgent ? 'agent' : 'inbound',
    agent_name: isAgent ? (user?.name ?? '') : '',
  });

  function validateForm() {
    const e: Record<string, string> = {};
    const innDigits = form.inn.replace(/\D/g, '');
    if (fr('inn')) {
      if (!innDigits) e.inn = `${fl('inn')} обязателен`;
      else if (innDigits.length !== 9) e.inn = 'ИНН — 9 цифр';
    }
    const pinflDigits = form.pinfl.replace(/\D/g, '');
    if (fr('pinfl')) {
      if (!pinflDigits) e.pinfl = `${fl('pinfl')} обязателен`;
      else if (pinflDigits.length !== 14) e.pinfl = 'ПИНФЛ — 14 цифр';
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (fr('phone')) {
      if (!phoneDigits || phoneDigits === '998') e.phone = `${fl('phone')} обязателен`;
      else if (!phoneDigits.startsWith('998') || phoneDigits.length !== 12) e.phone = 'Формат: +998 XX XXX-XX-XX';
    }
    if (fr('product') && !form.product) e.product = 'Выберите продукт';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn:  () => api.get('/leads'),
  });

  const { data: catalog = [] } = useQuery<CatalogItem[]>({
    queryKey: ['product-catalog'],
    queryFn:  () => api.get('/product-catalog'),
  });

  const { data: fieldCfg = [] } = useQuery<{ field: string; label: string; required: number; visible: number }[]>({
    queryKey: ['field-config-lead'],
    queryFn:  () => api.get('/admin/field-config?entity=lead'),
  });
  const fc = (field: string) => fieldCfg.find(f => f.field === field) ?? { label: field, required: 0, visible: 1 };
  const fv = (field: string) => fc(field).visible !== 0;
  const fr = (field: string) => fc(field).required !== 0;
  const fl = (field: string) => fc(field).label;
  const dInn   = useDebounced(form.inn,   600);
  const dPhone = useDebounced(form.phone, 600);
  const { data: dupCheck } = useQuery<{ inn_duplicate: { id: number; name: string; manager: string } | null; phone_duplicate: { id: number; name: string; manager: string } | null }>({
    queryKey: ['lead-check-form', dInn, dPhone],
    queryFn:  () => api.get(`/leads/check?inn=${encodeURIComponent(dInn)}&phone=${encodeURIComponent(dPhone)}`),
    enabled:  open && (dInn.length >= 9 || dPhone.replace(/\D/g, '').length >= 9),
  });

  const { data: arbitrations = [] } = useQuery<any[]>({
    queryKey: ['lead-arbitrations'],
    queryFn:  () => api.get('/leads/arbitration'),
  });
  const pendingArbs = arbitrations.filter((a: any) => a.status === 'pending');

  // Agents only see their own leads
  const leads = isAgent
    ? allLeads.filter(l => l.agent_name === user?.name)
    : allLeads;

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post<Lead>('/leads', { ...body, amount: parseFloat(body.amount) || 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      setOpen(false);
      setDupError(null);
      setErrors({});
      setForm({
        ...EMPTY_FORM,
        manager:    user?.name ?? '',
        source:     isAgent ? 'agent' : 'inbound',
        agent_name: isAgent ? (user?.name ?? '') : '',
      });
    },
    onError: (err: unknown) => {
      const e = err as { error?: string; duplicate_id?: number };
      setDupError(e.error ?? 'Ошибка создания лида');
      if (e.duplicate_id) setDupLeadId(e.duplicate_id);
    },
  });

  const submitArbitration = useMutation({
    mutationFn: () => api.post('/leads/arbitration', {
      new_lead: { ...form, amount: parseFloat(form.amount) || 0 },
      existing_lead_id: dupLeadId,
      comment: arbComment,
      duplicate_inn: form.inn || undefined,
      duplicate_phone: form.phone || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-arbitrations'] });
      setOpen(false); setArbOpen(false); setDupError(null); setDupLeadId(null); setArbComment(''); setErrors({});
      setForm({ ...EMPTY_FORM, manager: user?.name ?? '', source: isAgent ? 'agent' : 'inbound', agent_name: isAgent ? (user?.name ?? '') : '' });
    },
    onError: (err: unknown) => setDupError((err as { error?: string }).error ?? 'Ошибка отправки на арбитраж'),
  });

  const reviewArbitration = useMutation({
    mutationFn: ({ id, action, review_comment }: { id: number; action: 'approve' | 'reject'; review_comment?: string }) =>
      api.put(`/leads/arbitration/${id}`, { action, review_comment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead-arbitrations'] }); qc.invalidateQueries({ queryKey: ['leads'] }); setReviewId(null); setReviewComment(''); },
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put<Lead>(`/leads/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const counts = {
    new:            leads.filter(l => l.status === 'new').length,
    in_progress:    leads.filter(l => l.status === 'in_progress').length,
    meeting:        leads.filter(l => l.status === 'meeting').length,
    account_opened: leads.filter(l => l.status === 'account_opened').length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">{t('common.loading')}</div>;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('leads.title')}</h1>
          <p className="mt-4 text-base text-[#aaa]">{t('leads.total', { count: leads.length, newCount: counts.new })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[#e5e5e5] overflow-hidden">
            <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-semibold transition-colors ${view === 'list' ? 'bg-[#111] text-white' : 'text-[#888] hover:bg-[#f6f6f6]'}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 2h12M1 7h12M1 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <button onClick={() => setView('board')} className={`px-3 py-2 text-xs font-semibold transition-colors ${view === 'board' ? 'bg-[#111] text-white' : 'text-[#888] hover:bg-[#f6f6f6]'}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="1" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
          </div>
          <Button onClick={() => { setOpen(true); setDupError(null); }}>{t('leads.newBtn')}</Button>
        </div>
      </div>

      {/* Scenario stage counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 border-y border-[#eee] py-6">
        {([
          ['new',            t('leads.stageNew')],
          ['in_progress',    t('leads.stageInProgress')],
          ['meeting',        t('leads.stageMeeting')],
          ['account_opened', t('leads.stageAccountOpened')],
        ] as [string, string][]).map(([k, l]) => (
          <div key={k}>
            <div className="text-4xl font-bold text-[#111] leading-none">{counts[k as keyof typeof counts]}</div>
            <div className="text-sm text-[#aaa] mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {([
            ['new',            t('leads.stageNew'),            'bg-[#dbeafe] text-[#1d4ed8]'],
            ['in_progress',    t('leads.stageInProgress'),     'bg-[#fef9c3] text-[#854d0e]'],
            ['meeting',        t('leads.stageMeeting'),        'bg-[#fde7d0] text-[#9a3412]'],
            ['account_opened', t('leads.stageAccountOpened'),  'bg-[#dcfce7] text-[#166534]'],
          ] as [string, string, string][]).map(([status, label, color]) => {
            const col = leads.filter(l => l.status === status);
            return (
              <div
                key={status}
                className="kanban-col flex-shrink-0 w-64 rounded-2xl p-4 bg-[#f6f6f6] transition-colors"
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = '#efefef';
                  el.style.outline = '2px solid #ddd';
                  el.style.outlineOffset = '-2px';
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = '';
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                  }
                }}
                onDrop={e => {
                  e.preventDefault();
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = '';
                  el.style.outline = '';
                  el.style.outlineOffset = '';
                  const id = Number(e.dataTransfer.getData('text/plain'));
                  if (id) changeStatus.mutate({ id, status });
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>{label}</span>
                  <span className="text-xs text-[#aaa] ml-auto">{col.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.map(l => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={e => {
                        dragging.current = true;
                        e.dataTransfer.setData('text/plain', String(l.id));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        document.querySelectorAll<HTMLElement>('.kanban-col').forEach(el => {
                          el.style.background = '';
                          el.style.outline = '';
                          el.style.outlineOffset = '';
                        });
                        setTimeout(() => { dragging.current = false; }, 100);
                      }}
                      onClick={() => { if (!dragging.current) router.push(`/leads/${l.id}`); }}
                      className="kanban-card bg-white rounded-xl p-3 border border-[#f0f0f0] hover:border-[#ddd] hover:shadow-sm transition-all cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="text-sm font-semibold leading-tight mb-0.5">{l.name}</div>
                      {l.inn && <div className="text-[10px] text-[#aaa]">ИНН {l.inn}</div>}
                      <div className="text-xs text-[#888] mt-1">{l.product || '—'}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-[#aaa]">{l.phone}</div>
                        <div className="text-xs text-[#bbb]">{l.manager || '—'}</div>
                      </div>
                    </div>
                  ))}
                  {col.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#ccc]">Нет лидов</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className={`overflow-x-auto ${view === 'board' ? 'hidden' : ''}`}>
        <table className="crm-table min-w-[800px]">
          <colgroup>
            <col className="w-[26%]"/>
            <col className="w-[18%]"/>
            <col className="w-[14%]"/>
            <col className="w-[14%]"/>
            <col className="w-[16%]"/>
            <col className="w-[10%]"/>
            <col className="w-[2%]"/>
          </colgroup>
          <thead>
            <tr>
              <th>{t('leads.colCompany')}</th>
              <th>{t('leads.colContact')}</th>
              <th>{t('leads.colProduct')}</th>
              <th>{t('leads.colSource')}</th>
              <th>{t('leads.colStage')}</th>
              <th>{t('leads.colManager')}</th>
              <th className="!px-3"/>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <Fragment key={l.id}>
                <tr>
                  <td className="max-w-0">
                    <Link href={`/leads/${l.id}`} className="text-sm font-semibold hover:underline underline-offset-2 block truncate">{l.name}</Link>
                    {l.inn && <div className="text-[11px] text-[#aaa] mt-0.5">ИНН {l.inn}</div>}
                    {l.pinfl && <div className="text-[11px] text-[#aaa] mt-0.5">ПИНФЛ {l.pinfl}</div>}
                  </td>
                  <td className="max-w-0">
                    <div className="text-sm truncate">{l.contact || '—'}</div>
                    <div className="text-xs text-[#aaa] truncate">{l.phone}</div>
                  </td>
                  <td className="text-sm text-[#555] truncate max-w-0">{l.product || '—'}</td>
                  <td>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      l.source === 'branch' ? 'bg-[#fef3c7] text-[#92400e]' :
                      l.source === 'agent'  ? 'bg-[#ede9fe] text-[#6d28d9]' :
                      'bg-[#f3f4f6] text-[#555]'
                    }`}>
                      {SRC_LABELS[l.source] ?? l.source}
                    </div>
                    {l.source === 'branch' && l.branch && <div className="text-[11px] text-[#888] mt-0.5 truncate">{l.branch}</div>}
                    {l.source === 'agent'  && l.agent_name && <div className="text-[11px] text-[#888] mt-0.5 truncate">{l.agent_name}</div>}
                  </td>
                  <td>
                    <select
                      value={l.status}
                      onChange={e => changeStatus.mutate({ id: l.id, status: e.target.value })}
                      className={`status-select ${STATUS_CFG[l.status]?.color ?? 'bg-[#f3f4f6] text-[#555]'}`}
                    >
                      {Object.entries(STATUS_CFG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-sm truncate max-w-0">{l.manager || '—'}</td>
                  <td className="px-3 py-4">
                    <button
                      onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[#f3f3f3] transition-colors"
                      title="История стадий"
                    >
                      <svg className={`transition-transform duration-200 ${expandedId === l.id ? 'rotate-90' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 3l4 4-4 4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
                {expandedId === l.id && (
                  <tr>
                    <td colSpan={8} className="bg-[#fafafa] px-5 pb-3 pt-0">
                      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#bbb] mb-2 pt-3">
                        История переходов
                      </div>
                      <StageLine raw={l.stage_times ?? '{}'} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={8} className="py-14 text-center text-sm text-[#aaa]">Нет лидов</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Arbitration panel — supervisor/admin sees pending requests */}
      {isSupervisor && pendingArbs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Арбитраж лидов <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#fee2e2] text-[#991b1b] text-xs font-bold">{pendingArbs.length}</span></h2>
          <div className="space-y-3">
            {pendingArbs.map((arb: any) => {
              const lead = (() => { try { return JSON.parse(arb.new_lead_data); } catch { return {}; } })();
              return (
                <div key={arb.id} className="rounded-2xl border border-[#f0f0f0] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{lead.name || '—'}</div>
                      <div className="text-xs text-[#888] mt-0.5">ИНН {arb.duplicate_inn || lead.inn} · Тел {arb.duplicate_phone || lead.phone}</div>
                      <div className="text-xs text-[#555] mt-1">Менеджер: <span className="font-medium">{arb.requester}</span> · Дубликат лида #{arb.existing_lead_id}</div>
                      <div className="mt-2 rounded-lg bg-[#f9f9f9] px-3 py-2 text-sm text-[#444] italic">«{arb.comment}»</div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                      {reviewId === arb.id ? (
                        <div className="flex flex-col gap-2 w-48">
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-xs text-[#111] resize-none focus:outline-none focus:border-[#999]"
                            rows={2}
                            placeholder="Комментарий (необязательно)"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => reviewArbitration.mutate({ id: arb.id, action: 'approve', review_comment: reviewComment })} className="flex-1 rounded-lg bg-[#166534] text-white text-xs py-1.5 font-semibold hover:bg-[#14532d] transition-colors">Одобрить</button>
                            <button onClick={() => reviewArbitration.mutate({ id: arb.id, action: 'reject',  review_comment: reviewComment })} className="flex-1 rounded-lg bg-[#991b1b] text-white text-xs py-1.5 font-semibold hover:bg-[#7f1d1d] transition-colors">Отклонить</button>
                          </div>
                          <button onClick={() => { setReviewId(null); setReviewComment(''); }} className="text-xs text-[#999] underline underline-offset-2 text-center">Отмена</button>
                        </div>
                      ) : (
                        <button onClick={() => setReviewId(arb.id)} className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-xs font-semibold hover:border-[#999] transition-colors">Рассмотреть</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manager: show own submitted arbitrations */}
      {!isSupervisor && arbitrations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Мои заявки на арбитраж</h2>
          <div className="space-y-3">
            {arbitrations.map((arb: any) => {
              const lead = (() => { try { return JSON.parse(arb.new_lead_data); } catch { return {}; } })();
              const statusCfg = arb.status === 'pending' ? { label: 'На рассмотрении', cls: 'bg-[#fef9c3] text-[#854d0e]' }
                : arb.status === 'approved' ? { label: 'Одобрено', cls: 'bg-[#dcfce7] text-[#166534]' }
                : { label: 'Отклонено', cls: 'bg-[#fee2e2] text-[#991b1b]' };
              return (
                <div key={arb.id} className="rounded-2xl border border-[#f0f0f0] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{lead.name || '—'}</div>
                      <div className="text-xs text-[#888] mt-0.5">Дубликат лида #{arb.existing_lead_id}</div>
                      {arb.review_comment && <div className="mt-1 text-xs text-[#555] italic">Ответ: «{arb.review_comment}»</div>}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={open} title={t('leads.formTitle')} onClose={() => { setOpen(false); setDupError(null); setDupLeadId(null); setArbOpen(false); setArbComment(''); setErrors({}); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setOpen(false); setDupError(null); setDupLeadId(null); setArbOpen(false); setArbComment(''); setErrors({}); }}>{t('common.cancel')}</Button>
          <Button onClick={() => { if (validateForm()) create.mutate(form); }} disabled={!form.name || create.isPending || arbOpen}>{t('leads.createBtn')}</Button>
        </>}>
        <div className="space-y-4">
          {(dupCheck?.inn_duplicate || dupCheck?.phone_duplicate) && !dupError && (
            <div className="rounded-xl bg-[#fff7ed] border border-[#fed7aa] px-4 py-3 text-sm text-[#9a3412]">
              <div className="font-semibold mb-1">⚠️ Лид уже ведётся другим менеджером</div>
              {dupCheck?.inn_duplicate && <div className="text-xs">ИНН: «{dupCheck.inn_duplicate.name}» — {dupCheck.inn_duplicate.manager || 'не назначен'}</div>}
              {dupCheck?.phone_duplicate && <div className="text-xs">Тел.: «{dupCheck.phone_duplicate.name}» — {dupCheck.phone_duplicate.manager || 'не назначен'}</div>}
            </div>
          )}
          {dupError && (
            <div className="rounded-xl bg-[#fee2e2] px-4 py-3 text-sm text-[#991b1b]">
              <div>{dupError}</div>
              {dupLeadId && !arbOpen && (
                <button onClick={() => setArbOpen(true)} className="mt-2 text-xs font-semibold underline underline-offset-2">
                  Подать на арбитраж →
                </button>
              )}
              {arbOpen && (
                <div className="mt-3 space-y-2">
                  <label className="block text-xs font-semibold">Комментарий для руководителя *</label>
                  <textarea
                    value={arbComment}
                    onChange={e => setArbComment(e.target.value)}
                    className="w-full rounded-lg border border-[#fca5a5] bg-white px-3 py-2 text-sm text-[#111] resize-none focus:outline-none"
                    rows={3}
                    placeholder="Объясните причину создания лида при наличии дубликата..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (validateForm()) submitArbitration.mutate(); }}
                      disabled={!arbComment.trim() || submitArbitration.isPending}
                      className="rounded-lg bg-[#991b1b] text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-[#7f1d1d] transition-colors"
                    >
                      {submitArbitration.isPending ? 'Отправка...' : 'Отправить на арбитраж'}
                    </button>
                    <button onClick={() => setArbOpen(false)} className="text-xs underline underline-offset-2">Отмена</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company */}
          <div>
            <label className="field-label">{t('leads.fCompany')}</label>
            <input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setDupError(null); }} className="form-input" placeholder="ООО «Samarkand Textile»"/>
          </div>

          {/* INN + PINFL */}
          {(fv('inn') || fv('pinfl')) && (
            <div className="grid grid-cols-2 gap-3">
              {fv('inn') && (
                <div>
                  <label className="field-label">{fl('inn')}{fr('inn') ? ' *' : ''}</label>
                  <input
                    value={form.inn}
                    onChange={e => { setForm({ ...form, inn: e.target.value.replace(/\D/g, '').slice(0, 9) }); setDupError(null); setErrors(v => ({ ...v, inn: '' })); }}
                    className={`form-input ${errors.inn ? 'border-[#f87171]' : ''}`}
                    placeholder="309876543"
                    inputMode="numeric"
                  />
                  {errors.inn && <p className="mt-1 text-[11px] text-[#ef4444]">{errors.inn}</p>}
                </div>
              )}
              {fv('pinfl') && (
                <div>
                  <label className="field-label">{fl('pinfl')}{fr('pinfl') ? ' *' : ''}</label>
                  <input
                    value={form.pinfl}
                    onChange={e => { setForm({ ...form, pinfl: e.target.value.replace(/\D/g, '').slice(0, 14) }); setErrors(v => ({ ...v, pinfl: '' })); }}
                    className={`form-input ${errors.pinfl ? 'border-[#f87171]' : ''}`}
                    placeholder="12345678901234"
                    inputMode="numeric"
                  />
                  {errors.pinfl && <p className="mt-1 text-[11px] text-[#ef4444]">{errors.pinfl}</p>}
                </div>
              )}
            </div>
          )}

          {/* Contact + Phone */}
          {(fv('contact') || fv('phone')) && (
            <div className="grid grid-cols-2 gap-3">
              {fv('contact') && (
                <div>
                  <label className="field-label">{fl('contact')}</label>
                  <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="form-input" placeholder="Имя Фамилия"/>
                </div>
              )}
              {fv('phone') && (
                <div>
                  <label className="field-label">{fl('phone')}{fr('phone') ? ' *' : ''}</label>
                  <input
                    value={form.phone}
                    onChange={e => { setForm({ ...form, phone: formatUzPhone(e.target.value) }); setErrors(v => ({ ...v, phone: '' })); }}
                    onFocus={e => { if (!e.target.value) setForm({ ...form, phone: '+998 ' }); }}
                    className={`form-input ${errors.phone ? 'border-[#f87171]' : ''}`}
                    placeholder="+998 90 000-00-00"
                    inputMode="tel"
                  />
                  {errors.phone && <p className="mt-1 text-[11px] text-[#ef4444]">{errors.phone}</p>}
                </div>
              )}
            </div>
          )}

          {/* Product from catalog */}
          {fv('product') && (
            <div>
              <label className="field-label">{fl('product')}{fr('product') ? ' *' : ''}</label>
              <select
                value={form.product}
                onChange={e => { setForm({ ...form, product: e.target.value }); setErrors(v => ({ ...v, product: '' })); }}
                className={`form-input ${errors.product ? 'border-[#f87171]' : ''}`}
              >
                <option value="">— выберите продукт —</option>
                {catalog.filter(c => c.is_active !== 0).map(c => (
                  <option key={c.id} value={c.name}>{c.name}{c.category ? ` · ${c.category}` : ''}</option>
                ))}
              </select>
              {errors.product && <p className="mt-1 text-[11px] text-[#ef4444]">{errors.product}</p>}
            </div>
          )}

          {isAgent ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#fef3c7] px-4 py-3 text-sm text-[#92400e]">
              <span className="font-semibold">{fl('source')}:</span> {t('common.roles.agent')} · {user?.name}
            </div>
          ) : (fv('source') || fv('manager')) && (
            <div className="grid grid-cols-2 gap-3">
              {fv('source') && (
                <div>
                  <label className="field-label">{fl('source')}</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value, branch: '', agent_name: '' })} className="form-input">
                    <option value="inbound">Входящий</option>
                    <option value="agent">Агент / Партнёр</option>
                    <option value="branch">Филиал</option>
                    <option value="website">Сайт</option>
                    <option value="referral">Реферал</option>
                    <option value="cold">Холодный</option>
                    <option value="event">Мероприятие</option>
                  </select>
                </div>
              )}
              {fv('manager') && (
                <div>
                  <label className="field-label">{fl('manager')}</label>
                  <input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="form-input"/>
                </div>
              )}
            </div>
          )}
          {!isAgent && form.source === 'branch' && (
            <div><label className="field-label">Название филиала</label>
              <input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="form-input" placeholder="Самаркандский филиал"/>
            </div>
          )}
          {!isAgent && form.source === 'agent' && (
            <div><label className="field-label">Агент / Партнёр *</label>
              <input value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} className="form-input" placeholder="ООО «Buhgalter Plus»"/>
            </div>
          )}
          {fv('amount') && (
            <div><label className="field-label">{fl('amount')}</label>
              <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="form-input" placeholder="0"/>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
