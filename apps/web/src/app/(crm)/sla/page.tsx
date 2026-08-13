'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User } from '@crm/types';

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
  return <span className="font-mono text-sm font-bold text-[#e1261c]">+{fmtOverdue(overdue)}</span>;
}

export default function SlaPage() {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();
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
  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">Контроль SLA</h1>
          <p className="mt-4 text-base text-[#aaa]">
            Правило: лид обрабатывается за <span className="font-semibold text-[#111]">{stats?.sla_hours ?? 1} час</span>
          </p>
        </div>
        {isSupervisor && (
          <div className="flex items-center gap-3">
            <button
              onClick={createDemoBreach}
              disabled={demoBusy}
              className="flex h-10 items-center gap-2 rounded-full border border-[#e1261c] px-5 text-sm font-semibold text-[#e1261c] hover:bg-[#fee2e2] transition-colors disabled:opacity-50"
            >
              {demoBusy ? 'Создание...' : '⚡ Создать нарушение (демо)'}
            </button>
          </div>
        )}
      </div>

      {demoMsg && (
        <div className="mb-6 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] px-5 py-3 text-sm font-medium text-[#166534]">
          {demoMsg}
        </div>
      )}

      {/* Stats strip */}
      {isSupervisor && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 border-y border-[#eee] py-6">
          {[
            { label: 'Активных нарушений', value: stats.active_violations, alert: stats.active_violations > 0 },
            { label: 'Нарушителей',        value: stats.by_manager.length,       alert: false },
            { label: 'Среднее время реакции', value: fmtReaction(stats.avg_reaction_minutes), alert: false },
            { label: 'Лидов сегодня',      value: stats.total_today,     alert: false },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-5 border ${s.alert ? 'border-[#fecaca] bg-[#fef2f2]' : 'border-[#f0f0f0]'}`}>
              <div className={`text-3xl font-bold leading-none mb-2 ${s.alert ? 'text-[#e1261c]' : ''}`}>{s.value}</div>
              <div className="text-xs text-[#aaa]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Manager strip (non-supervisor) */}
      {!isSupervisor && (
        <div className="grid grid-cols-2 gap-4 mb-8 border-y border-[#eee] py-6">
          <div className={`rounded-2xl p-5 border ${violations.length > 0 ? 'border-[#fecaca] bg-[#fef2f2]' : 'border-[#f0f0f0]'}`}>
            <div className={`text-3xl font-bold leading-none mb-2 ${violations.length > 0 ? 'text-[#e1261c]' : ''}`}>{violations.length}</div>
            <div className="text-xs text-[#aaa]">Моих нарушений SLA</div>
          </div>
          <div className="rounded-2xl p-5 border border-[#f0f0f0]">
            <div className="text-3xl font-bold leading-none mb-2">{stats?.sla_hours ?? 1} ч</div>
            <div className="text-xs text-[#aaa]">Норматив обработки</div>
          </div>
        </div>
      )}

      {/* Tabs (supervisor only) */}
      {isSupervisor && (
        <div className="flex border-b border-[#f0f0f0] mb-6 text-sm font-semibold">
          {(['violations', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 border-b-2 transition-colors ${tab === t ? 'border-[#111] text-[#111]' : 'border-transparent text-[#aaa] hover:text-[#555]'}`}>
              {t === 'violations' ? `Нарушения (${violations.length})` : 'Аналитика'}
            </button>
          ))}
        </div>
      )}

      {/* Violations tab */}
      {(tab === 'violations' || !isSupervisor) && (
        violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-6">✅</div>
            <h2 className="text-xl font-semibold tracking-[-0.04em] mb-2">Нарушений SLA нет</h2>
            <p className="text-[#aaa] text-sm">Все лиды обрабатываются в срок</p>
          </div>
        ) : (
          <>
            {/* Escalation alert */}
            <div className="mb-6 rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-5">
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-0.5">🚨</div>
                <div>
                  <p className="font-semibold text-[#991b1b] text-base mb-1">
                    Эскалация: {violations.length} {violations.length === 1 ? 'нарушение' : violations.length < 5 ? 'нарушения' : 'нарушений'} SLA
                  </p>
                  <p className="text-sm text-[#b91c1c]">
                    Менеджеры не обработали лиды в течение {stats?.sla_hours ?? 1} часа.
                    {isSupervisor && ' Требуется вмешательство руководителя.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications block */}
            <div className="mb-6 space-y-2">
              {violations.slice(0, 3).map(v => (
                <div key={`notif-${v.id}`} className="flex items-start gap-3 rounded-xl border border-[#fde8e8] bg-[#fff5f5] px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e1261c] mt-2 flex-shrink-0 animate-pulse"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-[#111]">{v.manager || 'Без менеджера'}</span>
                      <span className="text-[#555]"> — лид </span>
                      <span className="font-medium">«{v.name}»</span>
                      <span className="text-[#aaa]"> не обработан</span>
                    </p>
                    <p className="text-xs text-[#aaa] mt-0.5">Просрочен на <Countdown createdAt={v.created_at} slaHours={stats?.sla_hours ?? 1} /></p>
                  </div>
                  <button
                    onClick={() => router.push(`/leads/${v.id}`)}
                    className="flex-shrink-0 text-xs text-[#e1261c] font-semibold hover:underline"
                  >
                    Открыть →
                  </button>
                </div>
              ))}
              {violations.length > 3 && (
                <p className="text-xs text-[#aaa] text-center pt-1">+ ещё {violations.length - 3} уведомлений ниже</p>
              )}
            </div>

            {/* Violations table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#f6f6f6] text-xs font-bold uppercase tracking-[0.08em] text-[#999]">
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
                    <tr key={v.id} className="border-b border-[#f0f0f0] hover:bg-[#fef2f2] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold">{v.name}</div>
                        <div className="text-xs text-[#aaa]">{v.contact} · {v.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {v.manager
                          ? <span className="font-medium">{v.manager}</span>
                          : <span className="text-[#aaa] italic">Не назначен</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-xs text-[#aaa]">{v.created_at?.slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fee2e2] text-[#991b1b] px-3 py-1 text-xs font-bold">
                          +{fmtOverdue(v.overdue_minutes)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#aaa]">{v.source || '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => router.push(`/leads/${v.id}`)}
                          className="text-xs text-[#111] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
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
              <p className="text-sm text-[#aaa]">Активных нарушений нет</p>
            ) : (
              <div className="space-y-3">
                {stats.by_manager.map((m, i) => {
                  const max = stats.by_manager[0].violations;
                  const pct = max > 0 ? (m.violations / max) * 100 : 0;
                  return (
                    <div key={m.manager} className="flex items-center gap-4">
                      <div className="w-6 text-xs text-[#aaa] text-right">{i + 1}</div>
                      <div className="w-36 text-sm font-medium truncate">{m.manager || '—'}</div>
                      <div className="flex-1 h-6 bg-[#f5f5f5] rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all"
                          style={{ width: `${pct}%`, backgroundColor: '#e1261c' }}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-sm font-bold text-[#e1261c]">{m.violations}</span>
                        <span className="text-xs text-[#aaa] ml-1">наруш.</span>
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
              <p className="text-sm text-[#aaa]">Недостаточно данных</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-[#f6f6f6] text-xs font-bold uppercase tracking-[0.08em] text-[#999]">
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
                        <tr key={m.manager} className="border-b border-[#f0f0f0] hover:bg-[#fcf8f8] transition-colors">
                          <td className="px-5 py-4 text-sm font-semibold">{m.manager || '—'}</td>
                          <td className="px-5 py-4">
                            <span className={`text-sm font-bold ${ok ? 'text-[#166534]' : 'text-[#e1261c]'}`}>
                              {fmtReaction(m.avg_minutes)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${ok ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                              {ok ? '✓ В норме' : '✗ Нарушает'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#555]">{m.processed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SLA rule card */}
          <div className="rounded-2xl border border-[#f0f0f0] p-6 bg-[#fafafa]">
            <p className="text-xs uppercase tracking-widest text-[#aaa] mb-3">Текущее правило SLA</p>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-3xl font-bold">{stats.sla_hours} ч</div>
                <div className="text-xs text-[#aaa] mt-1">Норматив обработки лида</div>
              </div>
              <div className="h-12 w-px bg-[#eee]"/>
              <div>
                <div className="text-3xl font-bold">15 мин</div>
                <div className="text-xs text-[#aaa] mt-1">Период проверки</div>
              </div>
              <div className="h-12 w-px bg-[#eee]"/>
              <div>
                <div className="text-3xl font-bold">{stats.avg_reaction_minutes !== null ? fmtReaction(stats.avg_reaction_minutes) : '—'}</div>
                <div className="text-xs text-[#aaa] mt-1">Среднее по банку</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
