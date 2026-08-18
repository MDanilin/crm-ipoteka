'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Lead } from '@crm/types';

const STATUS_LABEL: Record<string, string> = {
  new:          'Новый',
  in_progress:  'В работе',
  meeting:      'Встреча',
  qualified:    'Квалифицирован',
  proposal:     'КП отправлено',
  converted:    'Сделка',
  lost:         'Потерян',
};

// Промежуточные шаги делят один синий акцент, финал — зелёный/красный.
const STATUS_COLOR: Record<string, string> = {
  new:         'bg-g10 text-g70',
  in_progress: 'bg-ac-bg text-ac',
  meeting:     'bg-ac-bg text-ac',
  qualified:   'bg-ac-bg text-ac',
  proposal:    'bg-ac-bg text-ac',
  converted:   'bg-ok-bg text-ok',
  lost:        'bg-dn-bg text-dn',
};

export default function DsaHomePage() {
  const router    = useRouter();
  const user      = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const [tab, setTab] = useState<'mine' | 'stats'>('mine');

  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn:  () => api.get('/leads'),
  });

  const myLeads = allLeads.filter(l => l.agent_name === user?.name && l.source === 'dsa');

  const stats = {
    total:     myLeads.length,
    converted: myLeads.filter(l => l.status === 'converted').length,
    inWork:    myLeads.filter(l => !['new', 'lost', 'converted'].includes(l.status)).length,
    lost:      myLeads.filter(l => l.status === 'lost').length,
  };
  const conversion = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;

  function logout() { clearAuth(); router.replace('/login'); }

  return (
    <div className="flex flex-col flex-1 pb-safe">

      {/* Header */}
      <header className="bg-white border-b border-g20 px-5 pt-12 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-g60 font-medium uppercase tracking-widest mb-1">DSA</p>
          <h1 className="text-2xl font-bold tracking-[-0.04em] leading-tight">{user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-g60 mt-0.5">Выездной сотрудник</p>
        </div>
        <button
          onClick={logout}
          className="mt-1 text-xs text-g40 hover:text-g80 transition-colors"
        >
          Выйти
        </button>
      </header>

      {/* Stats strip */}
      <div className="bg-white border-b border-g20 grid grid-cols-4 divide-x divide-g20">
        {[
          { label: 'Всего',     val: stats.total },
          { label: 'В работе',  val: stats.inWork },
          { label: 'Сделок',   val: stats.converted },
          { label: 'Конверсия', val: `${conversion}%` },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 px-1">
            <span className="text-xl font-bold leading-none">{s.val}</span>
            <span className="text-[10px] text-g60 mt-1 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-g20 text-sm font-semibold">
        {(['mine', 'stats'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 transition-colors border-b-2 ${tab === t ? 'border-g90 text-g90' : 'border-transparent text-g60'}`}
          >
            {t === 'mine' ? 'Мои лиды' : 'Статистика'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'mine' ? (
          isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-g60">Загрузка...</div>
          ) : myLeads.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-base font-semibold mb-1">Лидов пока нет</p>
              <p className="text-sm text-g60">Создайте первый лид с клиентом</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeads.map(lead => (
                <div key={lead.id} className="bg-white rounded-2xl p-4 border border-g20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-g60 mt-0.5">{lead.contact} · {lead.phone}</p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[lead.status] ?? 'bg-g10 text-g70'}`}>
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </div>
                  {lead.manager && (
                    <p className="text-xs text-g60">Менеджер: <span className="text-g80">{lead.manager}</span></p>
                  )}
                  <p className="text-[11px] text-g40 mt-2">{lead.created_at?.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Stats tab */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-g20">
              <p className="text-sm font-semibold mb-4">Воронка лидов</p>
              {[
                { label: 'Новые',         val: myLeads.filter(l => l.status === 'new').length,         color: '#7c8695' },
                { label: 'В работе',      val: myLeads.filter(l => l.status === 'in_progress').length, color: '#2e5f94' },
                { label: 'Встречи',       val: myLeads.filter(l => l.status === 'meeting').length,     color: '#2e5f94' },
                { label: 'КП отправлены', val: myLeads.filter(l => l.status === 'proposal').length,    color: '#2e5f94' },
                { label: 'Сделки',        val: myLeads.filter(l => l.status === 'converted').length,   color: '#2f7d5f' },
                { label: 'Потеряны',      val: myLeads.filter(l => l.status === 'lost').length,        color: '#a13c3c' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-g80 w-28 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 h-5 bg-g10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: stats.total > 0 ? `${(row.val / stats.total) * 100}%` : '0%', backgroundColor: row.color }}
                    />
                  </div>
                  <span className="text-xs font-bold w-4 text-right">{row.val}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-g20">
              <p className="text-sm font-semibold mb-3">Конверсия в сделки</p>
              <div className="flex items-end gap-4">
                <div className="text-5xl font-bold leading-none">{conversion}%</div>
                <div className="text-sm text-g60 pb-1">{stats.converted} из {stats.total} лидов</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="sticky bottom-0 px-5 py-4 bg-gradient-to-t from-g5 to-transparent pointer-events-none">
        <button
          onClick={() => router.push('/dsa/new')}
          className="pointer-events-auto w-full h-14 rounded-2xl bg-g90 text-white text-base font-semibold shadow-lg active:scale-95 transition-transform"
        >
          + Новый лид
        </button>
      </div>
    </div>
  );
}
