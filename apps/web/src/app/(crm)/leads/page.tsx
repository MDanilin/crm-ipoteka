'use client';

import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Lead } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

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

const EMPTY_FORM = { name: '', contact: '', phone: '', inn: '', product: '', amount: '', source: 'inbound', branch: '', agent_name: '', status: 'new', manager: '' };

export default function LeadsPage() {
  const user     = useAuthStore(s => s.user);
  const isAgent  = user?.role === 'agent';
  const { t }    = useTranslation();
  const qc       = useQueryClient();
  const [open,       setOpen]       = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dupError,   setDupError]   = useState<string | null>(null);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    manager:    user?.name ?? '',
    source:     isAgent ? 'agent' : 'inbound',
    agent_name: isAgent ? (user?.name ?? '') : '',
  });

  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn:  () => api.get('/leads'),
  });
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
      setForm({
        ...EMPTY_FORM,
        manager:    user?.name ?? '',
        source:     isAgent ? 'agent' : 'inbound',
        agent_name: isAgent ? (user?.name ?? '') : '',
      });
    },
    onError: (err: unknown) => {
      setDupError((err as { error?: string }).error ?? 'Ошибка создания лида');
    },
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
        <Button onClick={() => { setOpen(true); setDupError(null); }}>{t('leads.newBtn')}</Button>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#f6f6f6] text-xs font-bold uppercase tracking-[0.08em] text-[#999]">
              <th className="rounded-l-xl px-5 py-4">{t('leads.colCompany')}</th>
              <th className="px-5 py-4">{t('leads.colContact')}</th>
              <th className="px-5 py-4">{t('leads.colProduct')}</th>
              <th className="px-5 py-4">{t('leads.colSource')}</th>
              <th className="px-5 py-4">{t('leads.colStage')}</th>
              <th className="px-5 py-4">{t('leads.colManager')}</th>
              <th className="px-5 py-4">{t('leads.colUpdated')}</th>
              <th className="rounded-r-xl px-3 py-4"/>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <Fragment key={l.id}>
                <tr className="border-b border-[#f0f0f0] hover:bg-[#fcf8f8] transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/leads/${l.id}`} className="text-sm font-semibold hover:underline underline-offset-2">{l.name}</Link>
                    {l.inn && <div className="text-[11px] text-[#aaa] mt-0.5">ИНН {l.inn}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm">{l.contact || '—'}</div>
                    <div className="text-xs text-[#aaa]">{l.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#555]">{l.product || '—'}</td>
                  <td className="px-5 py-4">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      l.source === 'branch' ? 'bg-[#fef3c7] text-[#92400e]' :
                      l.source === 'agent'  ? 'bg-[#ede9fe] text-[#6d28d9]' :
                      'bg-[#f3f4f6] text-[#555]'
                    }`}>
                      {SRC_LABELS[l.source] ?? l.source}
                    </div>
                    {l.source === 'branch' && l.branch && <div className="text-[11px] text-[#888] mt-0.5">{l.branch}</div>}
                    {l.source === 'agent'  && l.agent_name && <div className="text-[11px] text-[#888] mt-0.5">{l.agent_name}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={l.status}
                      onChange={e => changeStatus.mutate({ id: l.id, status: e.target.value })}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border-none outline-none cursor-pointer ${STATUS_CFG[l.status]?.color ?? 'bg-[#f3f4f6] text-[#555]'}`}
                    >
                      {Object.entries(STATUS_CFG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm">{l.manager || '—'}</td>
                  <td className="px-5 py-4 text-xs text-[#aaa]">{l.created_at?.slice(0, 10)}</td>
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

      {/* Create modal */}
      <Modal open={open} title={t('leads.formTitle')} onClose={() => { setOpen(false); setDupError(null); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setOpen(false); setDupError(null); }}>{t('common.cancel')}</Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.name || create.isPending}>{t('leads.createBtn')}</Button>
        </>}>
        <div className="space-y-4">
          {dupError && (
            <div className="rounded-xl bg-[#fee2e2] px-4 py-3 text-sm text-[#991b1b]">{dupError}</div>
          )}
          <div><label className="field-label">{t('leads.fCompany')}</label>
            <input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setDupError(null); }} className="form-input" placeholder="ООО «Samarkand Textile»"/>
          </div>
          <div><label className="field-label">{t('leads.fInn')}</label>
            <input value={form.inn} onChange={e => { setForm({ ...form, inn: e.target.value }); setDupError(null); }} className="form-input" placeholder="309876543"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('leads.fContact')}</label>
              <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="form-input" placeholder="Имя Фамилия"/>
            </div>
            <div><label className="field-label">{t('leads.fPhone')}</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" placeholder="+998 90 000-00-00"/>
            </div>
          </div>
          <div><label className="field-label">{t('leads.fProduct')}</label>
            <input value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="form-input" placeholder="Кредитная линия, расчётный счёт..."/>
          </div>
          {isAgent ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#fef3c7] px-4 py-3 text-sm text-[#92400e]">
              <span className="font-semibold">{t('leads.fSource')}:</span> {t('common.roles.agent')} · {user?.name}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('leads.fSource')}</label>
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
              <div><label className="field-label">{t('leads.fManager')}</label>
                <input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="form-input"/>
              </div>
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
          <div><label className="field-label">{t('leads.fAmount')}</label>
            <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="form-input" placeholder="0"/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
