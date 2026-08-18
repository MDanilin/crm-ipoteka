'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import type { SearchResult } from '@crm/types';
import { useRouter } from 'next/navigation';

export function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();
  const { t }  = useTranslation();
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results } = useQuery<SearchResult>({
    queryKey: ['search', q],
    queryFn:  () => api.get<SearchResult>(`/search?q=${encodeURIComponent(q)}`),
    enabled:  q.length >= 2,
    staleTime: 5_000,
  });

  function handleSearch(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.length >= 2) { timer.current = setTimeout(() => setOpen(true), 200); }
    else setOpen(false);
  }

  function toggleSearch() {
    setShow(s => {
      if (!s) setTimeout(() => inputRef.current?.focus(), 50);
      return !s;
    });
    if (show) { setQ(''); setOpen(false); }
  }

  return (
    <header className="flex h-[82px] items-center justify-between border-b border-g20 px-6 sm:px-10 flex-shrink-0 bg-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden rounded-full bg-g10 p-3 hover:bg-g20 transition-colors"
          aria-label="Меню"
        >
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
            <path d="M2 4.5h15M2 9.5h15M2 14.5h15" stroke="#171c24" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={toggleSearch}
          className="rounded-full bg-g10 p-3 hover:bg-g20 transition-colors"
          aria-label="Поиск"
        >
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
            <circle cx="8.5" cy="8.5" r="6" stroke="#171c24" strokeWidth="1.6"/>
            <path d="M13.5 13.5l3.5 3.5" stroke="#171c24" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        {show && (
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={e => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder={t('common.search')}
              className="h-11 w-64 rounded-full bg-g10 px-4 text-sm outline-none placeholder:text-g60 focus:bg-g20 transition-colors"
            />
            {open && results && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-g20 rounded-2xl shadow-xl z-50 overflow-hidden">
                {results.clients.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-g60 bg-g10">{t('common.searchClientsLabel')}</div>
                    {results.clients.map(c => (
                      <button key={c.id} onClick={() => { router.push(`/clients/${c.id}`); setOpen(false); setQ(''); setShow(false); }}
                        className="w-full flex items-start gap-2 px-4 py-3 hover:bg-g5 text-left transition-colors">
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="text-xs text-g60 mt-0.5">{c.industry}</div>
                      </button>
                    ))}
                  </>
                )}
                {results.leads.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-g60 bg-g10">{t('common.searchLeadsLabel')}</div>
                    {results.leads.map(l => (
                      <button key={l.id} onClick={() => { router.push('/leads'); setOpen(false); setQ(''); setShow(false); }}
                        className="w-full px-4 py-3 hover:bg-g5 text-left text-sm transition-colors">{l.name}</button>
                    ))}
                  </>
                )}
                {!results.clients.length && !results.leads.length && (
                  <div className="px-4 py-5 text-sm text-g60 text-center">{t('common.noResults')}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
