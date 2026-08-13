'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Deal, PipelineStage } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const STAGES: { id: PipelineStage; label: string; dot: string }[] = [
  { id:'qualification', label:'Квалификация', dot:'bg-[#3b82f6]' },
  { id:'proposal',      label:'Предложение',  dot:'bg-[#8b5cf6]' },
  { id:'negotiation',   label:'Переговоры',   dot:'bg-[#f59e0b]' },
  { id:'approval',      label:'Согласование', dot:'bg-[#10b981]' },
  { id:'closed',        label:'Закрыто',      dot:'bg-[#6b7280]' },
];

export default function PipelinePage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_name:'', product:'', amount:'', amount_raw:'', probability:'50', stage:'qualification', close_date:'', manager: user?.name ?? '' });

  const { data: deals = [] } = useQuery<Deal[]>({ queryKey:['pipeline'], queryFn: () => api.get('/pipeline') });

  const create = useMutation({
    mutationFn: (b: typeof form) => api.post('/pipeline', { ...b, amount_raw: parseFloat(b.amount_raw)||0, probability: parseInt(b.probability)||50, close_date: b.close_date ? new Date(b.close_date).toLocaleDateString('ru-RU').replace(/\//g,'.') : '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['pipeline'] }); setOpen(false); },
  });

  const active = deals.filter(d => d.stage !== 'closed');

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">Воронка</h1>
          <p className="mt-4 text-base text-[#aaa]">{active.length} активных сделок</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Сделка</Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(s => {
          const col   = deals.filter(d => d.stage === s.id);
          const total = col.reduce((sum,d) => sum + (d.amount_raw||0), 0);
          return (
            <div key={s.id} className="flex-shrink-0 w-60 bg-[#f6f6f6] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`}/>
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#555] flex-1">{s.label}</span>
                <span className="text-xs text-[#aaa]">{col.length}</span>
              </div>
              {total > 0 && <div className="text-xs text-[#aaa] px-1 mb-3">{total.toFixed(1)} млрд</div>}
              <div className="flex flex-col gap-2">
                {col.map(d => (
                  <Link key={d.id} href={`/pipeline/${d.id}`} className="block bg-white rounded-xl p-4 border border-[#f0f0f0] hover:border-[#ddd] hover:shadow-sm transition-all">
                    <div className="text-sm font-semibold mb-0.5 leading-tight">{d.client_name}</div>
                    <div className="text-xs text-[#aaa] mb-3">{d.product}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">{d.amount}</span>
                      <span className="text-xs text-[#aaa]">{d.manager}</span>
                    </div>
                    <div className="h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#111] transition-all" style={{ width:`${d.probability}%` }}/>
                    </div>
                    <div className="text-[10px] text-[#aaa] mt-1">{d.probability}% · {d.close_date || '—'}</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} title="Новая сделка" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.client_name || create.isPending}>Добавить</Button>
        </>}>
        <div className="space-y-4">
          <div><label className="field-label">Клиент *</label><input value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} className="form-input" placeholder="Название компании"/></div>
          <div><label className="field-label">Продукт</label><input value={form.product} onChange={e=>setForm({...form,product:e.target.value})} className="form-input" placeholder="Кредитная линия, FX..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Сумма (млрд)</label><input type="number" value={form.amount_raw} onChange={e=>setForm({...form,amount_raw:e.target.value,amount:e.target.value+' млрд'})} className="form-input"/></div>
            <div><label className="field-label">Вероятность %</label><input type="number" min="0" max="100" value={form.probability} onChange={e=>setForm({...form,probability:e.target.value})} className="form-input"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Стадия</label>
              <select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})} className="form-input">
                {STAGES.filter(s=>s.id!=='closed').map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="field-label">Дата закрытия</label><input type="date" value={form.close_date} onChange={e=>setForm({...form,close_date:e.target.value})} className="form-input"/></div>
          </div>
          <div><label className="field-label">Менеджер</label><input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="form-input"/></div>
        </div>
      </Modal>
    </div>
  );
}
