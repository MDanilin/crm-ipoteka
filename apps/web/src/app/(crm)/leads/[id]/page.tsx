'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { LeadDetail, LeadActivity, LeadTransfer, User } from '@crm/types';
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
  cold: 'Холодный', event: 'Мероприятие', branch: 'Филиал', agent: 'Агент', dsa: 'DSA',
};

const ACT_CFG: Record<string, { label: string; icon: string; bg: string }> = {
  call:    { label: 'Звонок',  icon: '📞', bg: 'bg-[#dbeafe]' },
  meeting: { label: 'Встреча', icon: '🤝', bg: 'bg-[#dcfce7]' },
  task:    { label: 'Задача',  icon: '✓',  bg: 'bg-[#fef9c3]' },
  note:    { label: 'Заметка', icon: '📝', bg: 'bg-[#f3f4f6]' },
};

const SCENARIO_STAGES = ['new', 'in_progress', 'meeting', 'account_opened'] as const;

function fmtTs(iso: string) {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function StageLine({ raw }: { raw: string }) {
  const times: Record<string, string> = (() => { try { return JSON.parse(raw || '{}'); } catch { return {}; } })();
  return (
    <div className="flex items-start flex-wrap gap-y-4">
      {SCENARIO_STAGES.map((s, i) => {
        const ts = times[s]; const done = !!ts;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center min-w-[120px]">
              <div className={`w-3 h-3 rounded-full ${done ? 'bg-[#111]' : 'bg-[#ddd]'}`}/>
              <div className={`text-[11px] mt-1.5 text-center font-medium leading-tight ${done ? 'text-[#111]' : 'text-[#bbb]'}`}>{STATUS_CFG[s]?.label}</div>
              <div className={`text-[10px] mt-0.5 ${ts ? 'text-[#888]' : 'text-[#ccc]'}`}>{ts ? fmtTs(ts) : '—'}</div>
            </div>
            {i < SCENARIO_STAGES.length - 1 && (
              <div className={`h-px w-8 mx-1 mt-[-18px] flex-shrink-0 ${done && times[SCENARIO_STAGES[i + 1] as string] ? 'bg-[#111]' : 'bg-[#e5e5e5]'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OwnershipTimeline({ transfers, currentManager, createdAt }: {
  transfers: LeadTransfer[];
  currentManager: string;
  createdAt: string;
}) {
  // Build the full chain: initial assignment + each transfer
  const chain: { from: string; to: string; reason: string; by: string; at: string; isCurrent: boolean }[] = [];

  if (transfers.length === 0) {
    // No transfers yet — just show original owner
    chain.push({ from: '', to: currentManager, reason: 'Первичное назначение', by: 'Система', at: createdAt, isCurrent: true });
  } else {
    // First entry: who had it originally (before first transfer)
    const first = transfers[0];
    if (first.from_user) {
      chain.push({ from: '', to: first.from_user, reason: 'Первичное назначение', by: 'Система', at: createdAt, isCurrent: false });
    }
    transfers.forEach((t, i) => {
      chain.push({ from: t.from_user, to: t.to_user, reason: t.reason, by: t.transferred_by, at: t.created_at, isCurrent: i === transfers.length - 1 });
    });
  }

  return (
    <div className="relative">
      {chain.map((entry, i) => (
        <div key={i} className="flex gap-4 pb-6 last:pb-0">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold ${entry.isCurrent ? 'bg-[#111] text-white' : 'bg-[#f3f3f3] text-[#555]'}`}>
              {entry.to.split(' ').map(w => w[0]).slice(0, 2).join('') || '?'}
            </div>
            {i < chain.length - 1 && <div className="w-px flex-1 bg-[#e5e5e5] mt-2"/>}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1.5 pb-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className={`text-sm font-semibold ${entry.isCurrent ? 'text-[#111]' : 'text-[#555]'}`}>{entry.to || '—'}</span>
                {entry.isCurrent && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dcfce7] text-[#166534]">Текущий владелец</span>
                )}
              </div>
              <span className="text-[11px] text-[#bbb] flex-shrink-0">{fmtDate(entry.at)}</span>
            </div>

            {entry.from && (
              <p className="text-xs text-[#aaa] mt-0.5">
                Передан от: <span className="text-[#555]">{entry.from}</span>
                {entry.by && entry.by !== entry.from && <> · Инициатор: <span className="text-[#555]">{entry.by}</span></>}
              </p>
            )}
            {entry.reason && (
              <div className="mt-1.5 inline-block bg-[#f9f9f9] rounded-lg px-3 py-1 text-xs text-[#555]">
                {entry.reason}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_ACT = { type: 'call', summary: '', result: '', date: new Date().toISOString().slice(0, 10), manager: '' };

export default function LeadDetailPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const user    = useAuthStore(s => s.user);
  const qc      = useQueryClient();
  const canTransfer = ['admin', 'supervisor', 'manager'].includes(user?.role ?? '');

  const [addOpen,      setAddOpen]      = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [lostOpen,     setLostOpen]     = useState(false);
  const [lostReason,   setLostReason]   = useState('');
  const [actForm,      setActForm]      = useState({ ...EMPTY_ACT, manager: user?.name ?? '' });
  const [txForm,       setTxForm]       = useState({ to_user: '', reason: '' });

  const { data: lead, isLoading } = useQuery<LeadDetail>({
    queryKey: ['lead', id],
    queryFn:  () => api.get(`/leads/${id}`),
  });

  const { data: users = [] } = useQuery<Pick<User, 'id' | 'name' | 'role'>[]>({
    queryKey: ['users-staff'],
    queryFn:  () => api.get('/users/staff'),
    enabled:  canTransfer,
  });

  const changeStatus = useMutation({
    mutationFn: (body: { status: string; lost_reason?: string }) => api.put(`/leads/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const transfer = useMutation({
    mutationFn: (body: typeof txForm) => api.post(`/leads/${id}/transfer`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setTransferOpen(false);
      setTxForm({ to_user: '', reason: '' });
    },
  });

  const addActivity = useMutation({
    mutationFn: (body: typeof actForm) => api.post<LeadActivity>(`/leads/${id}/activities`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      setAddOpen(false);
      setActForm({ ...EMPTY_ACT, manager: user?.name ?? '' });
    },
  });

  const delActivity = useMutation({
    mutationFn: (actId: number) => api.delete(`/leads/${id}/activities/${actId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', id] }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;
  if (!lead) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-2xl font-semibold tracking-[-0.04em] mb-2">Лид не найден</div>
      <button onClick={() => router.push('/leads')} className="text-sm text-[#aaa] hover:text-[#111] mt-3">← Все лиды</button>
    </div>
  );

  const staffUsers  = users;
  const srcLabel = SRC_LABELS[lead.source] ?? lead.source;
  const subLabel = lead.source === 'branch' ? lead.branch : lead.source === 'agent' ? lead.agent_name : '';
  const srcFull  = subLabel ? `${srcLabel} · ${subLabel}` : srcLabel;
  const transfers = lead.transfers ?? [];

  return (
    <div>
      <button onClick={() => router.push('/leads')} className="flex items-center gap-2 text-sm text-[#aaa] hover:text-[#111] transition-colors mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Все лиды
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-[clamp(32px,4vw,60px)] font-semibold leading-none tracking-[-0.07em]">{lead.name}</h1>
          {lead.inn && <p className="mt-2 text-sm text-[#aaa]">ИНН {lead.inn}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
          {canTransfer && (
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-full border border-[#e5e5e5] text-sm font-semibold text-[#555] hover:border-[#111] hover:text-[#111] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Передать лид
            </button>
          )}
          <select
            value={lead.status}
            onChange={e => {
              const s = e.target.value;
              if (s === 'lost') { setLostOpen(true); }
              else { changeStatus.mutate({ status: s }); }
            }}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold border-none outline-none cursor-pointer ${STATUS_CFG[lead.status]?.color ?? 'bg-[#f3f4f6] text-[#555]'}`}
          >
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border-y border-[#eee] py-6 mb-6">
        {[
          { label: 'Источник', value: srcFull },
          { label: 'Телефон',  value: lead.phone   || '—' },
          { label: 'Контакт',  value: lead.contact || '—' },
          { label: 'Продукт',  value: lead.product || '—' },
          { label: 'Менеджер', value: lead.manager || '—' },
        ].map(f => (
          <div key={f.label}>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-1">{f.label}</div>
            <div className="text-sm font-medium">{f.value}</div>
          </div>
        ))}
      </div>

      {/* Stage timeline */}
      <div className="border border-[#f0f0f0] rounded-2xl p-6 mb-6">
        <div className="text-base font-semibold mb-4">Воронка лида</div>
        <StageLine raw={lead.stage_times ?? '{}'} />
      </div>

      {/* Ownership history */}
      <div className="border border-[#f0f0f0] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-base font-semibold">История владения</div>
            <div className="text-sm text-[#aaa] mt-0.5">
              {transfers.length === 0 ? 'Передач не было' : `${transfers.length} ${transfers.length === 1 ? 'передача' : transfers.length < 5 ? 'передачи' : 'передач'}`}
            </div>
          </div>
          {canTransfer && (
            <button
              onClick={() => setTransferOpen(true)}
              className="text-sm font-semibold text-[#555] hover:text-[#111] transition-colors"
            >
              Передать →
            </button>
          )}
        </div>
        <OwnershipTimeline
          transfers={transfers}
          currentManager={lead.manager}
          createdAt={lead.created_at}
        />
      </div>

      {/* Activities */}
      <div className="border border-[#f0f0f0] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-base font-semibold">Активности</div>
            <div className="text-sm text-[#aaa] mt-0.5">{lead.activities.length} записей</div>
          </div>
          <Button size="sm" onClick={() => setAddOpen(!addOpen)}>+ Активность</Button>
        </div>

        {addOpen && (
          <div className="bg-[#f9f9f9] rounded-2xl p-5 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Тип</label>
                <select value={actForm.type} onChange={e => setActForm({ ...actForm, type: e.target.value })} className="form-input">
                  <option value="call">📞 Звонок</option>
                  <option value="meeting">🤝 Встреча</option>
                  <option value="task">✓ Задача</option>
                  <option value="note">📝 Заметка</option>
                </select>
              </div>
              <div>
                <label className="field-label">Дата</label>
                <input type="date" value={actForm.date} onChange={e => setActForm({ ...actForm, date: e.target.value })} className="form-input"/>
              </div>
            </div>
            <div>
              <label className="field-label">Описание *</label>
              <input value={actForm.summary} onChange={e => setActForm({ ...actForm, summary: e.target.value })} className="form-input" placeholder="Что сделано, о чём говорили..."/>
            </div>
            <div>
              <label className="field-label">Результат</label>
              <input value={actForm.result} onChange={e => setActForm({ ...actForm, result: e.target.value })} className="form-input" placeholder="Итог, договорённости, следующий шаг..."/>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Отмена</Button>
              <Button size="sm" onClick={() => addActivity.mutate(actForm)} disabled={!actForm.summary || addActivity.isPending}>Сохранить</Button>
            </div>
          </div>
        )}

        {lead.activities.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#aaa]">Активностей нет — добавьте первый звонок или встречу</div>
        ) : (
          <div className="space-y-0">
            {[...lead.activities].reverse().map((a, i) => {
              const cfg = ACT_CFG[a.type] ?? ACT_CFG.note;
              return (
                <div key={a.id} className={`flex gap-4 group py-4 ${i < lead.activities.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${cfg.bg}`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#555]">{cfg.label}</span>
                        <span className="text-[11px] text-[#bbb]">{a.date}</span>
                        {a.manager && <span className="text-[11px] text-[#bbb]">· {a.manager}</span>}
                      </div>
                      <button onClick={() => delActivity.mutate(a.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-[#e1261c] hover:opacity-70 transition-all flex-shrink-0">
                        Удалить
                      </button>
                    </div>
                    <div className="text-sm text-[#111] mt-1 leading-snug">{a.summary}</div>
                    {a.result && <div className="text-xs text-[#888] mt-1 bg-[#f9f9f9] rounded-lg px-3 py-1.5 inline-block">Итог: {a.result}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lost reason modal */}
      <Modal
        open={lostOpen}
        title="Причина отказа"
        onClose={() => { setLostOpen(false); setLostReason(''); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setLostOpen(false); setLostReason(''); }}>Отмена</Button>
          <Button
            onClick={() => { changeStatus.mutate({ status: 'lost', lost_reason: lostReason }); setLostOpen(false); setLostReason(''); }}
            disabled={changeStatus.isPending}
            className="bg-[#e1261c] hover:bg-[#c01f16]"
          >
            Закрыть как проигранный
          </Button>
        </>}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#777]">Укажите основную причину, чтобы аналитика потерь была точной.</p>

          {/* Preset reasons */}
          <div className="flex flex-wrap gap-2">
            {[
              'Конкурент предложил лучшую цену',
              'Нет бюджета',
              'Нет интереса к продукту',
              'Долгий процесс оформления',
              'Клиент выбрал другой банк',
            ].map(r => (
              <button
                key={r}
                onClick={() => setLostReason(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  lostReason === r
                    ? 'bg-[#111] text-white border-[#111]'
                    : 'bg-white text-[#555] border-[#e5e5e5] hover:border-[#999]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div>
            <label className="field-label">Или введите свою причину</label>
            <textarea
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              className="form-input resize-none h-20"
              placeholder="Опишите причину отказа..."
            />
          </div>
        </div>
      </Modal>

      {/* Transfer modal */}
      <Modal
        open={transferOpen}
        title="Передать лид"
        onClose={() => { setTransferOpen(false); setTxForm({ to_user: '', reason: '' }); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setTransferOpen(false); setTxForm({ to_user: '', reason: '' }); }}>Отмена</Button>
          <Button onClick={() => transfer.mutate(txForm)} disabled={!txForm.to_user || transfer.isPending}>
            Передать
          </Button>
        </>}
      >
        <div className="space-y-4">
          {/* Current owner */}
          <div className="rounded-xl bg-[#f9f9f9] px-4 py-3 text-sm">
            <span className="text-[#aaa]">Текущий владелец: </span>
            <span className="font-semibold">{lead.manager || '—'}</span>
          </div>

          <div>
            <label className="field-label">Новый ответственный *</label>
            <select
              value={txForm.to_user}
              onChange={e => setTxForm({ ...txForm, to_user: e.target.value })}
              className="form-input"
            >
              <option value="">Выберите сотрудника...</option>
              {staffUsers
                .filter(u => u.name !== lead.manager)
                .map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role === 'supervisor' ? 'Руководитель' : u.role === 'admin' ? 'Администратор' : 'Менеджер'})</option>
                ))}
            </select>
          </div>

          <div>
            <label className="field-label">Причина передачи</label>
            <textarea
              value={txForm.reason}
              onChange={e => setTxForm({ ...txForm, reason: e.target.value })}
              className="form-input resize-none h-20"
              placeholder="Клиент требует специализации, уход в отпуск, перегрузка..."
            />
          </div>

          {transfer.isError && (
            <p className="text-sm text-[#e1261c]">{(transfer.error as { error?: string })?.error ?? 'Ошибка передачи'}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
