'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User } from '@crm/types';
import { Badge } from '@/components/ui/Badge';

interface SlaViolation {
  id: number; name: string; contact: string; phone: string;
  manager: string; status: string; created_at: string;
  overdue_minutes: number; source: string;
}

interface SlaStats {
  sla_hours: number;
  active_violations: number;
  by_manager: { manager: string; violations: number }[];
  avg_reaction_minutes: number | null;
  total_today: number;
  historical_violations: number;
  manager_reaction_stats: { manager: string; avg_minutes: number; processed: number }[];
}

function fmtOverdue(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60); const m = min % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function fmtReaction(min: number | null): string {
  if (min === null) return '—';
  return fmtOverdue(min);
}

function Countdown({ createdAt, slaHours }: { createdAt: string; slaHours: number }) {
  const [, forceRender] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceRender(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const elapsedMin = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
  const overdue = Math.max(0, elapsedMin - slaHours * 60);
  return <span className="font-mono text-sm font-bold text-dn">+{fmtOverdue(overdue)}</span>;
}

export default function SlaPage() {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();
  const { t }  = useTranslation();
  const qc     = useQueryClient();
  const [tab,  setTab]  = useState<'violations' | 'stats'>('violations');
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMsg,  setDemoMsg]  = useState('');

  const isSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  const { data: violations = [], isLoading: vLoad, refetch: refetchV } = useQuery<SlaViolation[]>({
    queryKey: ['sla-violations'],
    queryFn:  () => api.get('/sla/violations'),
    refetchInterval: 60000,
  });

  const { data: stats, isLoading: sLoad, refetch: refetchS } = useQuery<SlaStats>({
    queryKey: ['sla-stats'],
    queryFn:  () => api.get('/sla/stats'),
    enabled:  isSupervisor,
    refetchInterval: 60000,
  });

  async function createDemoBreach() {
    setDemoBusy(true); setDemoMsg('');
    try {
      const res = await api.post<{ manager: string }>('/sla/demo-breach', {});
      await Promise.all([refetchV(), refetchS()]);
      setDemoMsg(`✓ Лид создан (нарушение для менеджера ${res.manager})`);
    } catch { setDemoMsg('Ошибка создания'); }
    finally { setDemoBusy(false); }
  }

  const isLoading = vLoad || (isSupervisor && sLoad);
  if (isLoading) return <div className="flex items-center justify-center h-64 text-g60 text-sm">Загрузка...</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('sla.title')}</h1>
          <p className="mt-4 text-base text-g60">
            Правило: лид обрабатывается за <span className="font-semibold text-g90">{stats?.sla_hours ?? 1} час</span>
          </p>
        </div>
        {isSupervisor && (
          <div className="flex items-center gap-3">
            <button
              onClick={createDemoBreach}
              disabled={demoBusy}
              className="flex h-10 items-center gap-2 rounded-full border border-dn px-5 text-sm font-semibold text-dn hover:bg-dn-bg transition-colors disabled:opacity-50"
            >
              {demoBusy ? 'Создание...' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Создать нарушение (демо)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {demoMsg && (
        <div className="mb-6 rounded-2xl bg-ok-bg border border-ok-border px-5 py-3 text-sm font-medium text-ok">
          {demoMsg}
        </div>
      )}

      {/* Stats strip */}
      {isSupervisor && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 border-y border-g20 py-6">
          {[
            { label: 'Активных нарушений', value: stats.active_violations, alert: stats.active_violations > 0 },
            { label: 'Нарушителей',        value: stats.by_manager.length,       alert: false },
            { label: 'Среднее время реакции', value: fmtReaction(stats.avg_reaction_minutes), alert: false },
            { label: 'Лидов сегодня',      value: stats.total_today,     alert: false },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-5 border ${s.alert ? 'border-dn-border bg-dn-bg' : 'border-g20'}`}>
              <div className={`text-3xl font-bold leading-none mb-2 ${s.alert ? 'text-dn' : ''}`}>{s.value}</div>
              <div className="text-xs text-g60">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Manager strip (non-supervisor) */}
      {!isSupervisor && (
        <div className="grid grid-cols-2 gap-4 mb-8 border-y border-g20 py-6">
          <div className={`rounded-2xl p-5 border ${violations.length > 0 ? 'border-dn-border bg-dn-bg' : 'border-g20'}`}>
            <div className={`text-3xl font-bold leading-none mb-2 ${violations.length > 0 ? 'text-dn' : ''}`}>{violations.length}</div>
            <div className="text-xs text-g60">Моих нарушений SLA</div>
          </div>
          <div className="rounded-2xl p-5 border border-g20">
            <div className="text-3xl font-bold leading-none mb-2">{stats?.sla_hours ?? 1} ч</div>
            <div className="text-xs text-g60">Норматив обработки</div>
          </div>
        </div>
      )}

      {/* Tabs (supervisor only) */}
      {isSupervisor && (
        <div className="flex border-b border-g20 mb-6 text-sm font-semibold">
          {(['violations', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 border-b-2 transition-colors ${tab === t ? 'border-g90 text-g90' : 'border-transparent text-g60 hover:text-g80'}`}>
              {t === 'violations' ? `Нарушения (${violations.length})` : 'Аналитика'}
            </button>
          ))}
        </div>
      )}

      {/* Violations tab */}
      {(tab === 'violations' || !isSupervisor) && (
        violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-ok-bg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2f7d5f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M8 12l3 3 5-5"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.04em] mb-2">Нарушений SLA нет</h2>
            <p className="text-g60 text-sm">Все лиды обрабатываются в срок</p>
          </div>
        ) : (
          <>
            {/* Escalation alert */}
            <div className="mb-6 rounded-2xl bg-dn-bg border border-dn-border p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a13c3c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-dn text-base mb-1">
                    Эскалация: {violations.length} {violations.length === 1 ? 'нарушение' : violations.length < 5 ? 'нарушения' : 'нарушений'} SLA
                  </p>
                  <p className="text-sm text-dn">
                    Менеджеры не обработали лиды в течение {stats?.sla_hours ?? 1} часа.
                    {isSupervisor && ' Требуется вмешательство руководителя.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications block */}
            <div className="mb-6 space-y-2">
              {violations.slice(0, 3).map(v => (
                <div key={`notif-${v.id}`} className="flex items-start gap-3 rounded-xl border border-dn-bg bg-dn-bg px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-dn mt-2 flex-shrink-0 animate-pulse"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-g90">{v.manager || 'Без менеджера'}</span>
                      <span className="text-g80"> — лид </span>
                      <span className="font-medium">«{v.name}»</span>
                      <span className="text-g60"> не обработан</span>
                    </p>
                    <p className="text-xs text-g60 mt-0.5">Просрочен на <Countdown createdAt={v.created_at} slaHours={stats?.sla_hours ?? 1} /></p>
                  </div>
                  <button
                    onClick={() => router.push(`/leads/${v.id}`)}
                    className="flex-shrink-0 text-xs text-dn font-semibold hover:underline"
                  >
                    Открыть →
                  </button>
                </div>
              ))}
              {violations.length > 3 && (
                <p className="text-xs text-g60 text-center pt-1">+ ещё {violations.length - 3} уведомлений ниже</p>
              )}
            </div>

            {/* Violations table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-g10 text-xs font-bold uppercase tracking-[0.08em] text-g60">
                    <th className="rounded-l-xl px-5 py-4">Лид</th>
                    <th className="px-5 py-4">Менеджер</th>
                    <th className="px-5 py-4">Создан</th>
                    <th className="px-5 py-4">Просрочен на</th>
                    <th className="px-5 py-4">Источник</th>
                    <th className="rounded-r-xl px-5 py-4"/>
                  </tr>
                </thead>
                <tbody>
                  {violations.map(v => (
                    <tr key={v.id} className="border-b border-g20 hover:bg-dn-bg transition-colors group">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold">{v.name}</div>
                        <div className="text-xs text-g60">{v.contact} · {v.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {v.manager
                          ? <span className="font-medium">{v.manager}</span>
                          : <span className="text-g60 italic">Не назначен</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-xs text-g60">{v.created_at?.slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-5 py-4">
                        <Badge variant="red" className="font-bold">+{fmtOverdue(v.overdue_minutes)}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-g60">{v.source || '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => router.push(`/leads/${v.id}`)}
                          className="text-xs text-g90 font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                        >
                          Обработать →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* Stats tab (supervisor only) */}
      {tab === 'stats' && isSupervisor && stats && (
        <div className="space-y-8">

          {/* Violations by manager */}
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] mb-4">Нарушения по менеджерам</h2>
            {stats.by_manager.length === 0 ? (
              <p className="text-sm text-g60">Активных нарушений нет</p>
            ) : (
              <div className="space-y-3">
                {stats.by_manager.map((m, i) => {
                  const max = stats.by_manager[0].violations;
                  const pct = max > 0 ? (m.violations / max) * 100 : 0;
                  return (
                    <div key={m.manager} className="flex items-center gap-4">
                      <div className="w-6 text-xs text-g60 text-right">{i + 1}</div>
                      <div className="w-36 text-sm font-medium truncate">{m.manager || '—'}</div>
                      <div className="flex-1 h-6 bg-g10 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all"
                          style={{ width: `${pct}%`, backgroundColor: '#a13c3c' }}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-sm font-bold text-dn">{m.violations}</span>
                        <span className="text-xs text-g60 ml-1">наруш.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Average reaction time by manager */}
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] mb-4">Среднее время реакции</h2>
            {stats.manager_reaction_stats.length === 0 ? (
              <p className="text-sm text-g60">Недостаточно данных</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-g10 text-xs font-bold uppercase tracking-[0.08em] text-g60">
                      <th className="rounded-l-xl px-5 py-3">Менеджер</th>
                      <th className="px-5 py-3">Среднее время</th>
                      <th className="px-5 py-3">В норме?</th>
                      <th className="rounded-r-xl px-5 py-3">Обработано лидов</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.manager_reaction_stats.map(m => {
                      const ok = m.avg_minutes <= (stats.sla_hours * 60);
                      return (
                        <tr key={m.manager} className="border-b border-g20 hover:bg-g5 transition-colors">
                          <td className="px-5 py-4 text-sm font-semibold">{m.manager || '—'}</td>
                          <td className="px-5 py-4">
                            <span className={`text-sm font-bold ${ok ? 'text-ok' : 'text-dn'}`}>
                              {fmtReaction(m.avg_minutes)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={ok ? 'green' : 'red'}>{ok ? '✓ В норме' : '✗ Нарушает'}</Badge>
                          </td>
                          <td className="px-5 py-4 text-sm text-g80">{m.processed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SLA rule card */}
          <div className="rounded-2xl border border-g20 p-6 bg-g5">
            <p className="text-xs uppercase tracking-widest text-g60 mb-3">Текущее правило SLA</p>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-3xl font-bold">{stats.sla_hours} ч</div>
                <div className="text-xs text-g60 mt-1">Норматив обработки лида</div>
              </div>
              <div className="h-12 w-px bg-g20"/>
              <div>
                <div className="text-3xl font-bold">15 мин</div>
                <div className="text-xs text-g60 mt-1">Период проверки</div>
              </div>
              <div className="h-12 w-px bg-g20"/>
              <div>
                <div className="text-3xl font-bold">{stats.avg_reaction_minutes !== null ? fmtReaction(stats.avg_reaction_minutes) : '—'}</div>
                <div className="text-xs text-g60 mt-1">Среднее по банку</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
