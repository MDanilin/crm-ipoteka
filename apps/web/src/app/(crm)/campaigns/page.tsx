'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Campaign } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

const STATUS_CFG: Record<string, { label: string; variant: 'gray' | 'green' | 'blue' }> = {
  draft:     { label: 'Черновик',  variant: 'gray' },
  active:    { label: 'Активная',  variant: 'green' },
  completed: { label: 'Завершена', variant: 'blue' },
};

export default function CampaignsPage() {
  const user   = useAuthStore(s => s.user);
  const qc     = useQueryClient();
  const router = useRouter();
  const { t }  = useTranslation();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', source: 'Телемаркетинг Q3' });

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn:  () => api.get('/campaigns'),
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post<Campaign>('/campaigns', body),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setCreateOpen(false);
      setForm({ name: '', source: 'Телемаркетинг Q3' });
      router.push(`/campaigns/${c.id}`);
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/campaigns/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;

  const isOperator = user?.role === 'operator';
  const canManage = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'manager';

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('campaigns.title')}</h1>
          <p className="mt-4 text-base text-[#aaa]">{campaigns.length} телемаркетинговых кампаний</p>
        </div>
        {canManage && <Button onClick={() => setCreateOpen(true)}>+ Новая кампания</Button>}
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-6">📞</div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] mb-2">Кампаний нет</h2>
          <p className="text-[#aaa] text-sm">Создайте первую кампанию и импортируйте список клиентов</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {campaigns.map(c => {
            const pct = c.total > 0 ? Math.round((c.processed / c.total) * 100) : 0;
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/campaigns/${c.id}`)}
                className="border border-[#f0f0f0] rounded-2xl p-6 cursor-pointer hover:bg-[#fcf8f8] hover:border-[#e8d8d8] transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold truncate group-hover:text-[#111]">{c.name}</div>
                    <div className="text-xs text-[#aaa] mt-0.5">{c.source}</div>
                  </div>
                  <Badge variant={STATUS_CFG[c.status]?.variant ?? 'gray'} className="ml-3 flex-shrink-0">
                    {STATUS_CFG[c.status]?.label ?? c.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5 border-t border-[#f5f5f5] pt-4">
                  <div>
                    <div className="text-2xl font-bold leading-none">{c.total}</div>
                    <div className="text-[11px] text-[#aaa] mt-1">Всего</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold leading-none text-[#111]">{c.processed}</div>
                    <div className="text-[11px] text-[#aaa] mt-1">Обработано</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold leading-none text-[#aaa]">{c.pending}</div>
                    <div className="text-[11px] text-[#aaa] mt-1">Осталось</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#aaa] mb-1.5">
                    <span>Прогресс</span><span className="font-semibold text-[#555]">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#111] transition-all" style={{ width: `${pct}%` }}/>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-[#aaa]">{c.created_at?.slice(0, 10)}</div>
                  {(user?.role === 'admin' || user?.role === 'supervisor') && (
                    <button
                      onClick={e => { e.stopPropagation(); del.mutate(c.id); }}
                      className="text-xs text-[#e1261c] opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} title="Новая кампания" onClose={() => setCreateOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.name || create.isPending}>Создать</Button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="field-label">Название кампании *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="form-input" placeholder="Телемаркетинг Q3 2026" autoFocus/>
          </div>
          <div>
            <label className="field-label">Источник</label>
            <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
              className="form-input" placeholder="Телемаркетинг Q3"/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
