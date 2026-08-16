'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Deal, PipelineStage } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const STAGES: { id: PipelineStage; label: string; dot: string }[] = [
  { id: 'qualification', label: 'Квалификация', dot: 'bg-[#3b82f6]' },
  { id: 'proposal',      label: 'Предложение',  dot: 'bg-[#8b5cf6]' },
  { id: 'negotiation',   label: 'Переговоры',   dot: 'bg-[#f59e0b]' },
  { id: 'approval',      label: 'Согласование', dot: 'bg-[#10b981]' },
  { id: 'closed',        label: 'Закрыто',      dot: 'bg-[#6b7280]' },
];

const EMPTY_FORM = { client_name: '', product: '', amount_raw: '', probability: '50', stage: 'qualification', close_date: '', manager: '' };

export default function PipelinePage() {
  const router   = useRouter();
  const user     = useAuthStore(s => s.user);
  const qc       = useQueryClient();
  const dragging = useRef(false);

  const [view,        setView]        = useState<'list' | 'board'>('board');
  const [search,      setSearch]      = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [open,        setOpen]        = useState(false);
  const [form,        setForm]        = useState({ ...EMPTY_FORM, manager: user?.name ?? '' });

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['pipeline'],
    queryFn:  () => api.get('/pipeline'),
  });

  const create = useMutation({
    mutationFn: (b: typeof form) => api.post('/pipeline', {
      ...b,
      amount:     b.amount_raw ? b.amount_raw + ' млрд' : '',
      amount_raw: parseFloat(b.amount_raw) || 0,
      probability: parseInt(b.probability) || 50,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      setOpen(false);
      setForm({ ...EMPTY_FORM, manager: user?.name ?? '' });
    },
  });

  const changeStage = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) => api.put(`/pipeline/${id}`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });

  const q        = search.toLowerCase();
  const filtered = deals.filter(d =>
    (!q || d.client_name.toLowerCase().includes(q) ||
     (d.manager ?? '').toLowerCase().includes(q) ||
     (d.product  ?? '').toLowerCase().includes(q)) &&
    (!filterStage || d.stage === filterStage)
  );

  const active        = deals.filter(d => d.stage !== 'closed');
  const totalPipeline = active.reduce((sum, d) => sum + (d.amount_raw || 0), 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">Воронка</h1>
          <p className="mt-4 text-base text-[#aaa]">
            {active.length} активных · {totalPipeline.toFixed(1)} млрд
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск клиента..."
            className="rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#999] w-44"
          />
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:border-[#999]"
          >
            <option value="">Все стадии</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="flex rounded-xl border border-[#e5e5e5] overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 transition-colors ${view === 'list' ? 'bg-[#111] text-white' : 'text-[#888] hover:bg-[#f6f6f6]'}`}
              title="Список"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 2h12M1 7h12M1 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setView('board')}
              className={`px-3 py-2 transition-colors ${view === 'board' ? 'bg-[#111] text-white' : 'text-[#888] hover:bg-[#f6f6f6]'}`}
              title="Канбан"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="7" y="1" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
          <Button onClick={() => setOpen(true)}>+ Сделка</Button>
        </div>
      </div>

      {/* Stage counters — кликабельные для фильтрации */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 border-y border-[#eee] py-6">
        {STAGES.map(s => {
          const col   = deals.filter(d => d.stage === s.id);
          const total = col.reduce((sum, d) => sum + (d.amount_raw || 0), 0);
          const active = filterStage === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setFilterStage(active ? '' : s.id)}
              className={`text-left rounded-xl px-3 py-2 transition-colors ${active ? 'bg-[#f3f3f3]' : 'hover:bg-[#f8f8f8]'}`}
            >
              <div className="text-4xl font-bold text-[#111] leading-none">{col.length}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`}/>
                <span className="text-sm text-[#aaa]">{s.label}</span>
              </div>
              {total > 0 && <div className="text-xs text-[#bbb] mt-0.5">{total.toFixed(1)} млрд</div>}
            </button>
          );
        })}
      </div>

      {/* Kanban */}
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => {
            const col   = filtered.filter(d => d.stage === s.id);
            const total = col.reduce((sum, d) => sum + (d.amount_raw || 0), 0);
            return (
              <div
                key={s.id}
                className="kanban-col flex-shrink-0 w-64 rounded-2xl p-4 bg-[#f6f6f6] transition-colors"
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const el = e.currentTarget as HTMLElement;
                  el.style.background    = '#efefef';
                  el.style.outline       = '2px solid #ddd';
                  el.style.outlineOffset = '-2px';
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background    = '';
                    el.style.outline       = '';
                    el.style.outlineOffset = '';
                  }
                }}
                onDrop={e => {
                  e.preventDefault();
                  const el = e.currentTarget as HTMLElement;
                  el.style.background    = '';
                  el.style.outline       = '';
                  el.style.outlineOffset = '';
                  const id = Number(e.dataTransfer.getData('text/plain'));
                  if (id) changeStage.mutate({ id, stage: s.id });
                }}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`}/>
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#555] flex-1">{s.label}</span>
                  <span className="text-xs text-[#aaa]">{col.length}</span>
                </div>
                {total > 0 && (
                  <div className="text-xs text-[#bbb] px-1 mb-3">{total.toFixed(1)} млрд</div>
                )}
                <div className="flex flex-col gap-2 mt-2">
                  {col.map(d => (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={e => {
                        dragging.current = true;
                        e.dataTransfer.setData('text/plain', String(d.id));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        document.querySelectorAll<HTMLElement>('.kanban-col').forEach(el => {
                          el.style.background    = '';
                          el.style.outline       = '';
                          el.style.outlineOffset = '';
                        });
                        setTimeout(() => { dragging.current = false; }, 100);
                      }}
                      onClick={() => { if (!dragging.current) router.push(`/pipeline/${d.id}`); }}
                      className="kanban-card bg-white rounded-xl p-4 border border-[#f0f0f0] hover:border-[#ddd] hover:shadow-sm transition-all cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="text-sm font-semibold mb-0.5 leading-tight">{d.client_name}</div>
                      <div className="text-xs text-[#aaa] mb-3">{d.product || '—'}</div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{d.amount || '—'}</span>
                        <span className="text-xs text-[#aaa]">{d.manager}</span>
                      </div>
                      <div className="h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#111] transition-all" style={{ width: `${d.probability}%` }}/>
                      </div>
                      <div className="text-[10px] text-[#aaa] mt-1">{d.probability}% · {d.close_date || '—'}</div>
                    </div>
                  ))}
                  {col.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#ccc]">Нет сделок</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="overflow-x-auto">
          <table className="crm-table min-w-[700px]">
            <colgroup>
              <col className="w-[22%]"/>
              <col className="w-[18%]"/>
              <col className="w-[11%]"/>
              <col className="w-[18%]"/>
              <col className="w-[14%]"/>
              <col className="w-[11%]"/>
              <col className="w-[6%]"/>
            </colgroup>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Продукт</th>
                <th>Сумма</th>
                <th>Стадия</th>
                <th>Вероятность</th>
                <th>Менеджер</th>
                <th>Закрытие</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                return (
                  <tr key={d.id}>
                    <td className="max-w-0">
                      <Link href={`/pipeline/${d.id}`} className="text-sm font-semibold hover:underline underline-offset-2 block truncate">
                        {d.client_name}
                      </Link>
                    </td>
                    <td className="text-sm text-[#555] truncate max-w-0">{d.product || '—'}</td>
                    <td className="text-sm font-semibold">{d.amount || '—'}</td>
                    <td>
                      <select
                        value={d.stage}
                        onChange={e => changeStage.mutate({ id: d.id, stage: e.target.value })}
                        className="status-select"
                      >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="max-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-1 min-w-0 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#111]" style={{ width: `${d.probability}%` }}/>
                        </div>
                        <span className="text-xs text-[#888] w-8 flex-shrink-0 text-right tabular-nums">{d.probability}%</span>
                      </div>
                    </td>
                    <td className="text-sm truncate max-w-0">{d.manager || '—'}</td>
                    <td className="text-xs text-[#888]">{d.close_date || '—'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm text-[#aaa]">
                    {search || filterStage ? 'Ничего не найдено' : 'Нет сделок'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Создать сделку */}
      <Modal
        open={open}
        title="Новая сделка"
        onClose={() => { setOpen(false); setForm({ ...EMPTY_FORM, manager: user?.name ?? '' }); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setOpen(false); setForm({ ...EMPTY_FORM, manager: user?.name ?? '' }); }}>
            Отмена
          </Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.client_name || create.isPending}>
            Добавить
          </Button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">Клиент *</label>
            <input
              value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })}
              className="form-input"
              placeholder="Название компании"
            />
          </div>
          <div>
            <label className="field-label">Продукт</label>
            <input
              value={form.product}
              onChange={e => setForm({ ...form, product: e.target.value })}
              className="form-input"
              placeholder="Кредитная линия, FX, Депозит..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Сумма (млрд)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.amount_raw}
                onChange={e => setForm({ ...form, amount_raw: e.target.value })}
                className="form-input"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="field-label">Вероятность %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={e => setForm({ ...form, probability: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Стадия</label>
              <select
                value={form.stage}
                onChange={e => setForm({ ...form, stage: e.target.value })}
                className="form-input"
              >
                {STAGES.filter(s => s.id !== 'closed').map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Дата закрытия</label>
              <input
                type="date"
                value={form.close_date}
                onChange={e => setForm({ ...form, close_date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <div>
            <label className="field-label">Менеджер</label>
            <input
              value={form.manager}
              onChange={e => setForm({ ...form, manager: e.target.value })}
              className="form-input"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
