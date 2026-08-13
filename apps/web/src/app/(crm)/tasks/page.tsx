'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Task } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';

const PRI_DOT = { high:'bg-[#e1261c]', medium:'bg-[#f59e0b]', low:'bg-[#10b981]' } as const;

const typeStyles: Record<string, string> = {
  call:     'bg-[#dbeafe] text-[#1d4ed8]',
  meeting:  'bg-[#ede9fe] text-[#6d28d9]',
  proposal: 'bg-[#fef3c7] text-[#92400e]',
  document: 'bg-[#f3f4f6] text-[#374151]',
  analysis: 'bg-[#dcfce7] text-[#166534]',
};
// TYPE_L resolved via t() below

export default function TasksPage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();
  const { t: tt } = useTranslation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title:'', type:'call', priority:'medium', due:'', manager: user?.name ?? '', client_name:'' });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn:  () => api.get('/tasks'),
  });

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) => api.put(`/tasks/${id}`, { done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post('/tasks', { ...body, due: body.due ? new Date(body.due).toLocaleDateString('ru-RU').replace(/\//g,'.') : '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setOpen(false); },
  });

  const open_  = tasks.filter(t => !t.done);
  const closed = tasks.filter(t =>  t.done);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">{tt('common.loading')}</div>;

  const TaskRow = ({ t }: { t: Task }) => (
    <div
      className={cn('flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-0 hover:bg-[#fcf8f8] cursor-pointer transition-colors', t.done && 'opacity-60')}
      onClick={() => toggle.mutate({ id: t.id, done: !t.done })}
    >
      <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors', t.done ? 'bg-[#10b981] border-[#10b981]' : 'border-[#ddd]')}>
        {!!t.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
      </div>
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', PRI_DOT[t.priority])}/>
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-medium', t.done && 'line-through text-[#aaa]')}>{t.title}</div>
        {t.client_name && <div className="text-xs text-[#aaa]">{t.client_name}</div>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${typeStyles[t.type] ?? 'bg-[#f3f4f6] text-[#555]'}`}>{tt(`tasks.types${t.type.charAt(0).toUpperCase() + t.type.slice(1)}`)}</span>
        <div className="text-xs text-[#aaa] w-20 text-right">{t.due}</div>
        <div className="text-xs text-[#aaa] w-24 text-right">{t.manager}</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{tt('tasks.title')}</h1>
          <p className="mt-4 text-base text-[#aaa]">{tt('tasks.statLine', { open: open_.length, done: closed.length })}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{tt('tasks.newBtn')}</Button>
      </div>

      {/* Open tasks */}
      <div className="border border-[#f0f0f0] rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <span className="text-sm font-semibold">{tt('tasks.openSection', { count: open_.length })}</span>
        </div>
        {open_.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#aaa]">{tt('tasks.noOpen')}</div>
        ) : open_.map(t => <TaskRow key={t.id} t={t}/>)}
      </div>

      {closed.length > 0 && (
        <div className="border border-[#f0f0f0] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0f0f0]">
            <span className="text-sm font-semibold">{tt('tasks.doneSection', { count: closed.length })}</span>
          </div>
          {closed.map(t => <TaskRow key={t.id} t={t}/>)}
        </div>
      )}

      <Modal open={open} title={tt('tasks.formTitle')} onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>{tt('common.cancel')}</Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.title || create.isPending}>{tt('tasks.createBtn')}</Button>
        </>}>
        <div className="space-y-4">
          <div><label className="field-label">{tt('tasks.fTitle')}</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="form-input" placeholder=""/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{tt('tasks.fType')}</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="form-input">
                <option value="call">{tt('tasks.typesCall')}</option><option value="meeting">{tt('tasks.typesMeeting')}</option><option value="proposal">{tt('tasks.typesProposal')}</option><option value="document">{tt('tasks.typesDocument')}</option><option value="analysis">{tt('tasks.typesAnalysis')}</option>
              </select>
            </div>
            <div><label className="field-label">{tt('tasks.fPriority')}</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="form-input">
                <option value="high">{tt('common.priority.high')}</option><option value="medium">{tt('common.priority.medium')}</option><option value="low">{tt('common.priority.low')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{tt('tasks.fDue')}</label><input type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})} className="form-input"/></div>
            <div><label className="field-label">{tt('tasks.fManager')}</label><input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="form-input"/></div>
          </div>
          <div><label className="field-label">{tt('tasks.fClient')}</label><input value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} className="form-input" placeholder=""/></div>
        </div>
      </Modal>
    </div>
  );
}
