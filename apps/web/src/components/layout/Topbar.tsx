'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchResult } from '@crm/types';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const router = useRouter();
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results } = useQuery<SearchResult>({
    queryKey: ['search', q],
    queryFn:  () => api.get<SearchResult>(`/search?q=${encodeURIComponent(q)}`),
    enabled:  q.length >= 2,
    staleTime: 5_000,
  });

  function handleSearch(value: string) {
    setQ(value);
    clearTimeout(timer.current);
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
    <header className="flex h-[82px] items-center justify-between border-b border-[#eee] px-6 sm:px-10 flex-shrink-0 bg-white">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSearch}
          className="rounded-full bg-[#f3f3f3] p-3 hover:bg-[#ebebeb] transition-colors"
          aria-label="Поиск"
        >
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
            <circle cx="8.5" cy="8.5" r="6" stroke="#111" strokeWidth="1.6"/>
            <path d="M13.5 13.5l3.5 3.5" stroke="#111" strokeWidth="1.6" strokeLinecap="round"/>
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
              placeholder="Поиск клиентов, задач..."
              className="h-11 w-64 rounded-full bg-[#f3f3f3] px-4 text-sm outline-none placeholder:text-[#aaa] focus:bg-[#ebebeb] transition-colors"
            />
            {open && results && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#ececec] rounded-2xl shadow-xl z-50 overflow-hidden">
                {results.clients.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] bg-[#f6f6f6]">Клиенты</div>
                    {results.clients.map(c => (
                      <button key={c.id} onClick={() => { router.push(`/clients/${c.id}`); setOpen(false); setQ(''); setShow(false); }}
                        className="w-full flex items-start gap-2 px-4 py-3 hover:bg-[#fcf8f8] text-left transition-colors">
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="text-xs text-[#aaa] mt-0.5">{c.industry}</div>
                      </button>
                    ))}
                  </>
                )}
                {results.leads.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] bg-[#f6f6f6]">Лиды</div>
                    {results.leads.map(l => (
                      <button key={l.id} onClick={() => { router.push('/leads'); setOpen(false); setQ(''); setShow(false); }}
                        className="w-full px-4 py-3 hover:bg-[#fcf8f8] text-left text-sm transition-colors">{l.name}</button>
                    ))}
                  </>
                )}
                {!results.clients.length && !results.leads.length && (
                  <div className="px-4 py-5 text-sm text-[#aaa] text-center">Ничего не найдено</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
