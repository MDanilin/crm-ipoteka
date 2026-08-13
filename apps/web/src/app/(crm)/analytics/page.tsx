'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import type { LostAnalytics, HQAnalytics, HQChannelStat, HQEmployeeStat } from '@crm/types';
import { exportHQToExcel, exportLostToExcel } from '@/lib/exportExcel';

// ── helpers ──────────────────────────────────────────────────────────────────

const SRC_LABELS: Record<string, string> = {
  inbound: 'Входящий', website: 'Сайт', referral: 'Реферал',
  cold: 'Холодный обзвон', event: 'Мероприятие', branch: 'Филиал',
  agent: 'Агент', dsa: 'DSA',
};
function srcLabel(s: string) { return SRC_LABELS[s] ?? s; }

function pct(n: number, total: number) { return total > 0 ? Math.round((n / total) * 100) : 0; }

function Bar({ value, max, color = '#111' }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">{label}</div>
      <div className="text-4xl font-bold text-[#111] leading-none">{value}</div>
      <div className="text-sm text-[#aaa] mt-1">{sub}</div>
    </div>
  );
}

// ── LOST TAB ─────────────────────────────────────────────────────────────────

function LostTab() {
  const { data, isLoading } = useQuery<LostAnalytics>({
    queryKey: ['analytics-lost'],
    queryFn:  () => api.get('/analytics/lost'),
  });

  if (isLoading || !data) return <Loader />;

  const topReason  = data.by_reason[0]?.reason  ?? '—';
  const topManager = data.by_manager[0]?.manager ?? '—';
  const maxReason  = data.by_reason[0]?.count   ?? 1;
  const maxSource  = data.by_source[0]?.count   ?? 1;

  return (
    <>
      <div className="flex justify-end mb-4">
        <ExportButton onClick={() => { exportLostToExcel(data); }} />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-[#eee] py-6 mb-8">
        <StatCard label="Всего потерь"       value={data.total}       sub="лидов проиграно" />
        <StatCard label="За этот месяц"      value={data.this_month}  sub="новых потерь" />
        <StatCard label="Топ причина"        value={<span className="text-xl leading-snug">{topReason}</span>} sub={`${data.by_reason[0]?.count ?? 0} случаев`} />
        <StatCard label="Больше всех теряет" value={<span className="text-xl">{topManager}</span>} sub={`${data.by_manager[0]?.count ?? 0} потерь`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Reasons */}
        <Section title="ТОП причин отказов" sub={`${data.by_reason.length} уникальных причин`}>
          {data.by_reason.length === 0
            ? <Empty />
            : data.by_reason.map((r, i) => (
              <div key={r.reason} className="flex items-center gap-4 py-3 border-b border-[#f5f5f5] last:border-0">
                <div className="w-[190px] shrink-0 text-sm font-medium truncate">{r.reason}</div>
                <Bar value={r.count} max={maxReason} color={i === 0 ? '#e1261c' : i === 1 ? '#f59e0b' : '#94a3b8'} />
                <span className="text-sm font-semibold w-7 text-right shrink-0">{r.count}</span>
                <span className="text-xs text-[#aaa] w-9 text-right shrink-0">{pct(r.count, data.total)}%</span>
              </div>
            ))}
        </Section>

        {/* By source */}
        <Section title="Потери по каналам" sub="Откуда приходят проигранные лиды">
          {data.by_source.length === 0
            ? <Empty />
            : data.by_source.map((s, i) => (
              <div key={s.source} className="flex items-center gap-4 py-3 border-b border-[#f5f5f5] last:border-0">
                <div className="w-[190px] shrink-0 text-sm font-medium truncate">{srcLabel(s.source)}</div>
                <Bar value={s.count} max={maxSource} color={i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : '#c4b5fd'} />
                <span className="text-sm font-semibold w-7 text-right shrink-0">{s.count}</span>
                <span className="text-xs text-[#aaa] w-9 text-right shrink-0">{pct(s.count, data.total)}%</span>
              </div>
            ))}
        </Section>
      </div>

      {/* Structure */}
      <Section title="Структура потерь" sub="Соотношение основных причин">
        <div className="flex gap-0.5 h-10 rounded-xl overflow-hidden mb-4">
          {data.by_reason.map((r, i) => {
            const w = pct(r.count, data.total);
            const colors = ['#e1261c','#f59e0b','#6366f1','#10b981','#8b5cf6','#94a3b8'];
            return <div key={r.reason} style={{ width: `${w}%`, backgroundColor: colors[i % colors.length] }} title={`${r.reason}: ${r.count} (${w}%)`} />;
          })}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {data.by_reason.map((r, i) => {
            const colors = ['#e1261c','#f59e0b','#6366f1','#10b981','#8b5cf6','#94a3b8'];
            return (
              <div key={r.reason} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-[#555]">{r.reason}</span>
                <span className="text-[#aaa] font-medium">{pct(r.count, data.total)}%</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* By manager */}
      <div className="mt-6">
        <Section title="Потери по сотрудникам" sub="Кто закрывает больше всего лидов как проигранных">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {['#','Сотрудник','Потерь','Доля'].map(h => (
                  <th key={h} className={`py-2.5 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] ${h === '#' || h === 'Потерь' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_manager.map((m, i) => (
                <tr key={m.manager} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                  <td className="py-3 px-2 text-center text-[#bbb]">{i + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f3f3f3] flex items-center justify-center text-xs font-bold text-[#555]">
                        {m.manager.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <span className="font-medium">{m.manager}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${i === 0 ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#f3f4f6] text-[#555]'}`}>{m.count}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Bar value={m.count} max={data.by_manager[0]?.count ?? 1} color="#e1261c" />
                      <span className="text-xs text-[#aaa] w-8">{pct(m.count, data.total)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </>
  );
}

// ── HQ TAB ───────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '30 дней',  value: '30' },
  { label: '90 дней',  value: '90' },
  { label: 'Всё время', value: '365' },
];

const FUNNEL_STAGES: { key: string; label: string }[] = [
  { key: 'new',            label: 'Новый' },
  { key: 'in_progress',    label: 'В работе' },
  { key: 'meeting',        label: 'Встреча' },
  { key: 'account_opened', label: 'Открыт счёт' },
  { key: 'converted',      label: 'Конвертирован' },
  { key: 'lost',           label: 'Потерян' },
];

function HQTab() {
  const [period, setPeriod] = useState('30');

  const { data, isLoading } = useQuery<HQAnalytics>({
    queryKey: ['analytics-hq', period],
    queryFn:  () => api.get(`/analytics/hq?period=${period}`),
  });

  if (isLoading || !data) return <Loader />;

  const activeCh = data.by_channel.filter(c => c.total > 0);
  const maxLeads  = Math.max(...activeCh.map(c => c.total), 1);
  const maxConv   = Math.max(...data.by_employee.map(e => e.leads), 1);

  return (
    <>
      {/* Period selector + overall stats */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatCard label="Лидов за период" value={data.total}          sub="всего" />
          <StatCard label="Конвертировано"  value={data.converted}      sub={`из ${data.total}`} />
          <StatCard label="Конверсия"       value={`${data.conversion_pct}%`} sub="общая" />
          <StatCard label="Ср. срок"        value={data.avg_days != null ? `${data.avg_days} д` : '—'} sub="обработки лида" />
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={() => { exportHQToExcel(data, period); }} />
          <div className="flex gap-1 bg-[#f5f5f5] rounded-xl p-1">
          {PERIOD_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === o.value ? 'bg-white shadow-sm text-[#111]' : 'text-[#888] hover:text-[#555]'}`}
            >
              {o.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* 1. Лиды по каналам + конверсия */}
      <Section title="Лиды по каналам" sub="Количество, конверсия и средний срок обработки">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {['Канал','Лидов','Конвертировано','Потеряно','Активных','Конверсия','Ср. срок, д.'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#999]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_channel.map((c: HQChannelStat) => (
                <tr key={c.channel} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                  <td className="py-3 px-3 font-semibold">{c.channel}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-medium">{c.total}</span>
                      <Bar value={c.total} max={maxLeads} color="#6366f1" />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#15803d] font-medium">{c.converted}</td>
                  <td className="py-3 px-3 text-[#991b1b]">{c.lost}</td>
                  <td className="py-3 px-3 text-[#555]">{c.active}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      c.conversion_pct >= 50 ? 'bg-[#dcfce7] text-[#166534]' :
                      c.conversion_pct >= 20 ? 'bg-[#fef9c3] text-[#854d0e]' :
                      c.total > 0            ? 'bg-[#fee2e2] text-[#991b1b]' :
                      'bg-[#f3f4f6] text-[#aaa]'
                    }`}>{c.total > 0 ? `${c.conversion_pct}%` : '—'}</span>
                  </td>
                  <td className="py-3 px-3 text-[#555]">{c.avg_days != null ? c.avg_days : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 2. Воронка по каналам */}
      <div className="mt-6">
        <Section title="Воронка по каналам" sub="Распределение лидов по стадиям для каждого канала">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  <th className="py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] w-[140px]">Этап</th>
                  {data.by_channel.map(c => (
                    <th key={c.channel} className="py-2.5 px-3 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#999]">{c.channel}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNNEL_STAGES.map(stage => (
                  <tr key={stage.key} className="border-b border-[#f8f8f8]">
                    <td className={`py-2.5 px-3 text-xs font-semibold ${
                      stage.key === 'converted' ? 'text-[#15803d]' :
                      stage.key === 'lost'      ? 'text-[#991b1b]' : 'text-[#555]'
                    }`}>{stage.label}</td>
                    {data.by_channel.map(c => {
                      const val = c.funnel[stage.key as keyof typeof c.funnel] ?? 0;
                      return (
                        <td key={c.channel} className="py-2.5 px-3 text-center">
                          {val > 0 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              stage.key === 'converted' ? 'bg-[#dcfce7] text-[#166534]' :
                              stage.key === 'lost'      ? 'bg-[#fee2e2] text-[#991b1b]' :
                              'bg-[#f3f4f6] text-[#555]'
                            }`}>{val}</span>
                          ) : (
                            <span className="text-[#ddd]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* 3. Конверсия сотрудников */}
      <div className="mt-6">
        <Section title="Конверсия сотрудников" sub="Эффективность обработки лидов">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {['Сотрудник','Лидов','Конвертировано','Конверсия','Ср. срок'].map(h => (
                  <th key={h} className={`py-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] ${h === 'Лидов' || h === 'Конвертировано' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_employee.map((e: HQEmployeeStat) => (
                <tr key={e.name} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f3f3f3] flex items-center justify-center text-xs font-bold text-[#555]">
                        {e.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-right">{e.leads}</span>
                      <Bar value={e.leads} max={maxConv} color="#6366f1" />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-[#15803d] font-semibold">{e.converted}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      e.conversion_pct >= 50 ? 'bg-[#dcfce7] text-[#166534]' :
                      e.conversion_pct >= 20 ? 'bg-[#fef9c3] text-[#854d0e]' :
                      e.leads > 0            ? 'bg-[#fee2e2] text-[#991b1b]' :
                      'bg-[#f3f4f6] text-[#aaa]'
                    }`}>{e.leads > 0 ? `${e.conversion_pct}%` : '—'}</span>
                  </td>
                  <td className="py-3 px-3 text-[#555] text-sm">{e.avg_days != null ? `${e.avg_days} д` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* 4. Производительность сотрудников */}
      <div className="mt-6">
        <Section title="Производительность сотрудников" sub="Активности по типам за выбранный период">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {['Сотрудник','📞 Звонки','🤝 Встречи','✓ Задачи','Всего'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#999]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_employee.map((e: HQEmployeeStat) => {
                const total = e.calls + e.meetings + e.tasks;
                return (
                  <tr key={e.name} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f3f3f3] flex items-center justify-center text-xs font-bold text-[#555]">
                          {e.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                        </div>
                        <span className="font-medium">{e.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${e.calls > 0 ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'text-[#ccc]'}`}>{e.calls > 0 ? e.calls : '—'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${e.meetings > 0 ? 'bg-[#dcfce7] text-[#166534]' : 'text-[#ccc]'}`}>{e.meetings > 0 ? e.meetings : '—'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${e.tasks > 0 ? 'bg-[#fef9c3] text-[#854d0e]' : 'text-[#ccc]'}`}>{e.tasks > 0 ? e.tasks : '—'}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#555]">{total > 0 ? total : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      </div>
    </>
  );
}

// ── shared micro-components ───────────────────────────────────────────────────

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e5e7eb] bg-white text-sm font-medium text-[#555] hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v9M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      Выгрузить в Excel
    </button>
  );
}

function Loader() {
  return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;
}
function Empty() {
  return <div className="py-10 text-center text-sm text-[#aaa]">Нет данных</div>;
}
function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#f0f0f0] rounded-2xl p-6">
      <div className="mb-5">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-[#aaa] mt-0.5">{sub}</div>
      </div>
      {children}
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hq',   label: 'HQ Отчёт' },
  { id: 'lost', label: 'Аналитика потерь' },
] as const;

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'hq' | 'lost'>('hq');
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
        <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('analytics.title')}</h1>
        <div className="flex gap-1 bg-[#f5f5f5] rounded-xl p-1 self-start sm:self-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-[#111]' : 'text-[#888] hover:text-[#555]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'hq'   && <HQTab />}
      {tab === 'lost' && <LostTab />}
    </div>
  );
}
