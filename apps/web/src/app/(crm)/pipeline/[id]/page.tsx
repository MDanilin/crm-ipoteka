'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Deal, PipelineStage } from '@crm/types';
import { cn } from '@/lib/cn';

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'qualification', label: 'Квалификация', color: 'bg-[#3b82f6]' },
  { id: 'proposal',      label: 'Предложение',  color: 'bg-[#8b5cf6]' },
  { id: 'negotiation',   label: 'Переговоры',   color: 'bg-[#f59e0b]' },
  { id: 'approval',      label: 'Согласование', color: 'bg-[#10b981]' },
  { id: 'closed',        label: 'Закрыто',      color: 'bg-[#6b7280]' },
];

export default function DealPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn:  () => api.get(`/pipeline/${id}`),
  });

  const [form, setForm] = useState<Partial<Deal>>({});

  const updateMut = useMutation({
    mutationFn: (d: Partial<Deal>) => api.put(`/pipeline/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal', id] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      setEditing(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/pipeline/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      router.replace('/pipeline');
    },
  });

  if (isLoading) return <div className="py-20 text-center text-[#aaa] text-sm">Загрузка...</div>;
  if (!deal)     return <div className="py-20 text-center text-[#aaa] text-sm">Сделка не найдена</div>;

  const stage = STAGES.find(s => s.id === deal.stage);
  const editForm = { ...deal, ...form };

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-[#aaa] hover:text-[#111] transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Воронка
      </button>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(28px,4vw,48px)] font-semibold leading-none tracking-[-0.04em]">{deal.client_name}</h1>
          <p className="mt-2 text-base text-[#aaa]">{deal.product}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing ? (
            <>
              <button
                onClick={() => { setForm({}); setEditing(true); }}
                className="h-9 px-4 rounded-full border border-[#e5e7eb] text-sm font-medium text-[#555] hover:border-[#999] transition-colors"
              >
                Изменить
              </button>
              <button
                onClick={() => { if (confirm(`Удалить сделку «${deal.client_name}»?`)) deleteMut.mutate(); }}
                className="h-9 px-4 rounded-full border border-[#e5e7eb] text-sm font-medium text-red-500 hover:border-red-300 transition-colors"
              >
                Удалить
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(false)} className="h-9 px-4 rounded-full border border-[#e5e7eb] text-sm font-medium text-[#555] hover:border-[#999] transition-colors">
                Отмена
              </button>
              <button
                onClick={() => updateMut.mutate(editForm)}
                disabled={updateMut.isPending}
                className="h-9 px-4 rounded-full bg-[#111] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-40 transition-colors"
              >
                {updateMut.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stage bar */}
      <div className="mb-8 flex gap-1">
        {STAGES.map((s, i) => {
          const stageIdx = STAGES.findIndex(x => x.id === (editing ? editForm.stage : deal.stage));
          const filled = i <= stageIdx;
          return (
            <button
              key={s.id}
              disabled={!editing}
              onClick={() => editing && setForm(f => ({ ...f, stage: s.id }))}
              title={s.label}
              className={cn(
                'flex-1 h-2 rounded-full transition-all',
                filled ? s.color : 'bg-[#e5e7eb]',
                editing && 'cursor-pointer hover:opacity-80',
                !editing && 'cursor-default'
              )}
            />
          );
        })}
      </div>
      <div className="mb-6 flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', stage?.color)} />
        <span className="text-sm font-medium">{stage?.label}</span>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card label="Сумма">
          {editing ? (
            <input
              type="number"
              defaultValue={deal.amount_raw}
              onChange={e => setForm(f => ({ ...f, amount_raw: parseFloat(e.target.value) || 0, amount: e.target.value + ' млрд' }))}
              className="w-full bg-[#f5f5f5] rounded-lg px-3 h-9 text-sm outline-none"
            />
          ) : (
            <span className="text-xl font-bold">{deal.amount}</span>
          )}
        </Card>
        <Card label="Вероятность">
          {editing ? (
            <input
              type="number" min="0" max="100"
              defaultValue={deal.probability}
              onChange={e => setForm(f => ({ ...f, probability: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[#f5f5f5] rounded-lg px-3 h-9 text-sm outline-none"
            />
          ) : (
            <div>
              <span className="text-xl font-bold">{deal.probability}%</span>
              <div className="mt-2 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#111]" style={{ width: `${deal.probability}%` }} />
              </div>
            </div>
          )}
        </Card>
        <Card label="Дата закрытия">
          {editing ? (
            <input
              type="date"
              defaultValue={deal.close_date}
              onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))}
              className="w-full bg-[#f5f5f5] rounded-lg px-3 h-9 text-sm outline-none"
            />
          ) : (
            <span className="text-sm font-medium">{deal.close_date || '—'}</span>
          )}
        </Card>
        <Card label="Менеджер">
          <span className="text-sm font-medium">{deal.manager}</span>
        </Card>
      </div>

      {deal.client_id && (
        <button
          onClick={() => router.push(`/clients/${deal.client_id}`)}
          className="flex items-center gap-2 text-sm text-[#111] font-medium hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M1 14c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Перейти к клиенту
        </button>
      )}
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#f8f8f8] rounded-2xl p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#aaa] mb-2">{label}</div>
      {children}
    </div>
  );
}
