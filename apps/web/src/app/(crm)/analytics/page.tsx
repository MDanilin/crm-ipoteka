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

function Bar({ value, max, color = '#171c24' }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-g20 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-g60 mb-2">{label}</div>
      <div className="text-4xl font-bold text-g90 leading-none">{value}</div>
      <div className="text-sm text-g60 mt-1">{sub}</div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-g20 py-6 mb-8">
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
              <div key={r.reason} className="flex items-center gap-4 py-3 border-b border-g10 last:border-0">
                <div className="w-[190px] shrink-0 text-sm font-medium truncate">{r.reason}</div>
                <Bar value={r.count} max={maxReason} color={i === 0 ? '#a13c3c' : i === 1 ? '#8a6a1c' : '#aeb6c2'} />
                <span className="text-sm font-semibold w-7 text-right shrink-0">{r.count}</span>
                <span className="text-xs text-g60 w-9 text-right shrink-0">{pct(r.count, data.total)}%</span>
              </div>
            ))}
        </Section>

        {/* By source */}
        <Section title="Потери по каналам" sub="Откуда приходят проигранные лиды">
          {data.by_source.length === 0
            ? <Empty />
            : data.by_source.map((s, i) => (
              <div key={s.source} className="flex items-center gap-4 py-3 border-b border-g10 last:border-0">
                <div className="w-[190px] shrink-0 text-sm font-medium truncate">{srcLabel(s.source)}</div>
                <Bar value={s.count} max={maxSource} color={i === 0 ? '#171c24' : i === 1 ? '#515b6b' : '#aeb6c2'} />
                <span className="text-sm font-semibold w-7 text-right shrink-0">{s.count}</span>
                <span className="text-xs text-g60 w-9 text-right shrink-0">{pct(s.count, data.total)}%</span>
              </div>
            ))}
        </Section>
      </div>

      {/* Structure */}
      <Section title="Структура потерь" sub="Соотношение основных причин">
        <div className="flex gap-0.5 h-10 rounded-xl overflow-hidden mb-4">
          {data.by_reason.map((r, i) => {
            const w = pct(r.count, data.total);
            const colors = ['#a13c3c','#8a6a1c','#333c49','#515b6b','#7c8695','#aeb6c2'];
            return <div key={r.reason} style={{ width: `${w}%`, backgroundColor: colors[i % colors.length] }} title={`${r.reason}: ${r.count} (${w}%)`} />;
          })}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {data.by_reason.map((r, i) => {
            const colors = ['#a13c3c','#8a6a1c','#333c49','#515b6b','#7c8695','#aeb6c2'];
            return (
              <div key={r.reason} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-g80">{r.reason}</span>
                <span className="text-g60 font-medium">{pct(r.count, data.total)}%</span>
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
              <tr className="border-b border-g20">
                {['#','Сотрудник','Потерь','Доля'].map(h => (
                  <th key={h} className={`py-2.5 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-g60 ${h === '#' || h === 'Потерь' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_manager.map((m, i) => (
                <tr key={m.manager} className="border-b border-g5 hover:bg-g5">
                  <td className="py-3 px-2 text-center text-g40">{i + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-g10 flex items-center justify-center text-xs font-bold text-g80">
                        {m.manager.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <span className="font-medium">{m.manager}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-sm ${i === 0 ? 'text-dn font-semibold' : 'text-g90 font-bold'}`}>{m.count}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Bar value={m.count} max={data.by_manager[0]?.count ?? 1} color="#a13c3c" />
                      <span className="text-xs text-g60 w-8">{pct(m.count, data.total)}%</span>
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
          <div className="flex gap-1 bg-g10 rounded-xl p-1">
          {PERIOD_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === o.value ? 'bg-white shadow-sm text-g90' : 'text-g70 hover:text-g80'}`}
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
              <tr className="border-b border-g20">
                {['Канал','Лидов','Конвертировано','Потеряно','Активных','Конверсия','Ср. срок, д.'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-g60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_channel.map((c: HQChannelStat) => (
                <tr key={c.channel} className="border-b border-g5 hover:bg-g5">
                  <td className="py-3 px-3 font-semibold">{c.channel}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-medium">{c.total}</span>
                      <Bar value={c.total} max={maxLeads} color="#333c49" />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-ok font-medium">{c.converted}</td>
                  <td className="py-3 px-3 text-dn">{c.lost}</td>
                  <td className="py-3 px-3 text-g80">{c.active}</td>
                  <td className="py-3 px-3">
                    <span className={`text-sm ${
                      c.conversion_pct >= 50 ? 'text-g90 font-bold' :
                      c.conversion_pct >= 20 ? 'text-g90 font-bold' :
                      c.total > 0            ? 'text-dn font-semibold' :
                      'text-g60'
                    }`}>{c.total > 0 ? `${c.conversion_pct}%` : '—'}</span>
                  </td>
                  <td className="py-3 px-3 text-g80">{c.avg_days != null ? c.avg_days : '—'}</td>
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
                <tr className="border-b border-g20">
                  <th className="py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-g60 w-[140px]">Этап</th>
                  {data.by_channel.map(c => (
                    <th key={c.channel} className="py-2.5 px-3 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-g60">{c.channel}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNNEL_STAGES.map(stage => (
                  <tr key={stage.key} className="border-b border-g5">
                    <td className={`py-2.5 px-3 text-xs font-semibold ${
                      stage.key === 'converted' ? 'text-ok' :
                      stage.key === 'lost'      ? 'text-dn' : 'text-g80'
                    }`}>{stage.label}</td>
                    {data.by_channel.map(c => {
                      const val = c.funnel[stage.key as keyof typeof c.funnel] ?? 0;
                      return (
                        <td key={c.channel} className="py-2.5 px-3 text-center">
                          {val > 0 ? (
                            <span className={`text-sm ${
                              stage.key === 'lost' ? 'text-dn font-semibold' : 'text-g90 font-bold'
                            }`}>{val}</span>
                          ) : (
                            <span className="text-g30">—</span>
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
              <tr className="border-b border-g20">
                {['Сотрудник','Лидов','Конвертировано','Конверсия','Ср. срок'].map(h => (
                  <th key={h} className={`py-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-g60 ${h === 'Лидов' || h === 'Конвертировано' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_employee.map((e: HQEmployeeStat) => (
                <tr key={e.name} className="border-b border-g5 hover:bg-g5">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-g10 flex items-center justify-center text-xs font-bold text-g80">
                        {e.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-right">{e.leads}</span>
                      <Bar value={e.leads} max={maxConv} color="#333c49" />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-ok font-semibold">{e.converted}</td>
                  <td className="py-3 px-3">
                    <span className={`text-sm ${
                      e.conversion_pct >= 50 ? 'text-g90 font-bold' :
                      e.conversion_pct >= 20 ? 'text-g90 font-bold' :
                      e.leads > 0            ? 'text-dn font-semibold' :
                      'text-g60'
                    }`}>{e.leads > 0 ? `${e.conversion_pct}%` : '—'}</span>
                  </td>
                  <td className="py-3 px-3 text-g80 text-sm">{e.avg_days != null ? `${e.avg_days} д` : '—'}</td>
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
              <tr className="border-b border-g20">
                {['Сотрудник','📞 Звонки','🤝 Встречи','✓ Задачи','Всего'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-g60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_employee.map((e: HQEmployeeStat) => {
                const total = e.calls + e.meetings + e.tasks;
                return (
                  <tr key={e.name} className="border-b border-g5 hover:bg-g5">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-g10 flex items-center justify-center text-xs font-bold text-g80">
                          {e.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                        </div>
                        <span className="font-medium">{e.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-sm ${e.calls > 0 ? 'text-g90 font-bold' : 'text-g40'}`}>{e.calls > 0 ? e.calls : '—'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-sm ${e.meetings > 0 ? 'text-g90 font-bold' : 'text-g40'}`}>{e.meetings > 0 ? e.meetings : '—'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-sm ${e.tasks > 0 ? 'text-g90 font-bold' : 'text-g40'}`}>{e.tasks > 0 ? e.tasks : '—'}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-g80">{total > 0 ? total : '—'}</td>
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
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-g30 bg-white text-sm font-medium text-g80 hover:bg-g5 hover:border-g30 transition-colors"
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
  return <div className="flex items-center justify-center h-64 text-g60 text-sm">Загрузка...</div>;
}
function Empty() {
  return <div className="py-10 text-center text-sm text-g60">Нет данных</div>;
}
function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="border border-g20 rounded-2xl p-6">
      <div className="mb-5">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-g60 mt-0.5">{sub}</div>
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
        <div className="flex gap-1 bg-g10 rounded-xl p-1 self-start sm:self-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-g90' : 'text-g70 hover:text-g80'}`}
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
