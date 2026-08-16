'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { DashboardStats } from '@crm/types';
import { Badge } from '@/components/ui/Badge';

const PRIORITY_COLOR = { high:'bg-[#e1261c]', medium:'bg-[#f59e0b]', low:'bg-[#10b981]' } as const;

const statusVariants: Record<string, 'green' | 'orange' | 'gray'> = {
  active:   'green',
  pending:  'orange',
  inactive: 'gray',
};

export default function DashboardPage() {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();
  const { t }  = useTranslation();

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn:  () => api.get('/dashboard'),
  });

  const { data: slaViolations = [] } = useQuery<{ id: number; name: string; manager: string; overdue_minutes: number }[]>({
    queryKey: ['sla-violations'],
    queryFn:  () => api.get('/sla/violations'),
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">{t('common.loading')}</div>;
  }

  return (
    <div>
      {/* SLA alert banner */}
      {slaViolations.length > 0 && (
        <div
          onClick={() => router.push('/sla')}
          className="mb-6 flex items-center gap-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 cursor-pointer hover:bg-[#fee2e2] transition-colors"
        >
          <div className="text-xl">🚨</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#991b1b]">
              {slaViolations.length} {slaViolations.length === 1 ? 'нарушение' : slaViolations.length < 5 ? 'нарушения' : 'нарушений'} SLA
            </p>
            <p className="text-xs text-[#b91c1c] truncate">
              {slaViolations.slice(0, 2).map(v => v.name).join(', ')}{slaViolations.length > 2 ? ` и ещё ${slaViolations.length - 2}` : ''}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#991b1b] flex-shrink-0">Перейти →</span>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-base text-[#aaa] mb-2">
            {t('dashboard.welcome', { name: user?.name.split(' ')[0], role: t(`common.roles.${user?.role ?? 'manager'}`) })}
          </p>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('dashboard.title')}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 border-y border-[#eee] py-6">
        {[
          { label: t('dashboard.clientsLabel'), value: data.clientCount,   sub: t('dashboard.clientsSub') },
          { label: t('dashboard.dealsLabel'),   value: data.activeDeals,   sub: t('dashboard.dealsSub') },
          { label: t('dashboard.tasksLabel'),   value: data.openTasks,     sub: t('dashboard.tasksSub') },
          { label: t('dashboard.pipelineLabel'),value: data.pipelineTotal, sub: t('dashboard.pipelineSub'), large: true },
        ].map(s => (
          <div key={s.label}>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">{s.label}</div>
            <div className={`font-bold text-[#111] leading-none ${s.large ? 'text-2xl' : 'text-4xl'}`}>{s.value}</div>
            <div className="text-sm text-[#aaa] mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold">{t('dashboard.upcomingTasks')}</span>
            <button onClick={() => router.push('/tasks')} className="text-sm text-[#aaa] hover:text-[#111] transition-colors">{t('dashboard.allTasks')}</button>
          </div>
          <div className="border border-[#f0f0f0] rounded-2xl overflow-hidden">
            {data.todayTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#aaa]">{t('dashboard.noTasks')}</div>
            ) : data.todayTasks.map(t => (
              <div
                key={t.id}
                onClick={() => router.push('/tasks')}
                className={`flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-0 cursor-pointer hover:bg-[#fcf8f8] transition-colors ${t.done ? 'opacity-50' : ''}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${t.done ? 'bg-[#10b981] border-[#10b981]' : 'border-[#ddd]'}`}>
                  {!!t.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLOR[t.priority]}`}/>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${t.done ? 'line-through text-[#aaa]' : ''}`}>{t.title}</div>
                  {t.client_name && <div className="text-xs text-[#aaa]">{t.client_name}</div>}
                </div>
                <div className="text-xs text-[#aaa] flex-shrink-0">{t.due}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold">{t('dashboard.recentClients')}</span>
            <button onClick={() => router.push('/clients')} className="text-sm text-[#aaa] hover:text-[#111] transition-colors">{t('dashboard.allClients')}</button>
          </div>
          <div className="border border-[#f0f0f0] rounded-2xl overflow-hidden">
            {data.myClients.map(c => (
              <div
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-0 cursor-pointer hover:bg-[#fcf8f8] transition-colors"
              >
                <div className="grid size-10 place-items-center rounded-full bg-[#f3dcd8] text-xs font-bold text-[#7c3f36] flex-shrink-0">
                  {(c.short_name || c.name[0])}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-[#aaa]">{c.industry}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariants[c.status] ?? 'gray'}>
                    {t(`common.status.${c.status}`)}
                  </Badge>
                  <span className="text-xs text-[#aaa]">{c.last_contact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
