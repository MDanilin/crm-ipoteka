'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Client } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const statusStyles: Record<string, string> = {
  active:   'bg-[#dcfce7] text-[#166534]',
  pending:  'bg-[#fef3c7] text-[#92400e]',
  inactive: 'bg-[#f3f4f6] text-[#6b7280]',
};
const statusL = { active:'Активный', pending:'На рассмотрении', inactive:'Неактивный' } as const;
const riskStyles: Record<string, string> = {
  low:    'bg-[#dcfce7] text-[#166534]',
  medium: 'bg-[#fef3c7] text-[#92400e]',
  high:   'bg-[#fee2e2] text-[#991b1b]',
};
const riskL = { low:'Низкий', medium:'Средний', high:'Высокий' } as const;

export default function ClientsPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name:'', type:'Крупный бизнес', industry:'', inn:'', city:'Ташкент', phone:'', email:'', manager:'', segment:'Standard', status:'active', risk_level:'low', rating:'', revenue:'', credit_limit:'', employees:'' });

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  () => api.get('/clients'),
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post('/clients', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); setForm({ name:'', type:'Крупный бизнес', industry:'', inn:'', city:'Ташкент', phone:'', email:'', manager:'', segment:'Standard', status:'active', risk_level:'low', rating:'', revenue:'', credit_limit:'', employees:'' }); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">Клиенты</h1>
          <p className="mt-4 text-base text-[#aaa]">Управляйте корпоративными отношениями</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Новый клиент</Button>
      </div>

      {/* Count row */}
      <div className="mb-5 flex items-center justify-between border-y border-[#eee] py-4">
        <span className="text-sm font-semibold">Всего {clients.length} клиентов</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#f6f6f6] text-xs font-bold uppercase tracking-[0.08em] text-[#999]">
              <th className="rounded-l-xl px-5 py-4">Клиент</th>
              <th className="px-5 py-4">Тип</th>
              <th className="px-5 py-4">Отрасль</th>
              <th className="px-5 py-4">Менеджер</th>
              <th className="px-5 py-4">Сегмент</th>
              <th className="px-5 py-4">Статус</th>
              <th className="px-5 py-4">Риск</th>
              <th className="rounded-r-xl px-5 py-4">Контакт</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="border-b border-[#f0f0f0] cursor-pointer hover:bg-[#fcf8f8] transition-colors"
              >
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-[#f1dfdc] text-xs font-bold text-[#7c3f36] flex-shrink-0">
                      {c.short_name || c.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-[#aaa] mt-0.5">{c.city}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#555]">{c.type}</span>
                </td>
                <td className="px-5 py-5 text-sm text-[#555]">{c.industry || '—'}</td>
                <td className="px-5 py-5 text-sm">{c.manager || '—'}</td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.segment === 'Premium' ? 'bg-[#ede9fe] text-[#6d28d9]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{c.segment}</span>
                </td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[c.status] ?? 'bg-[#f3f4f6] text-[#555]'}`}>{statusL[c.status]}</span>
                </td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${riskStyles[c.risk_level] ?? 'bg-[#f3f4f6] text-[#555]'}`}>{riskL[c.risk_level]}</span>
                </td>
                <td className="px-5 py-5 text-xs text-[#aaa]">{c.last_contact || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Новый клиент" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.name || create.isPending}>
            {create.isPending ? 'Создание...' : 'Создать клиента'}
          </Button>
        </>}>
        <div className="space-y-4">
          {/* Основное */}
          <div><label className="field-label">Название *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="form-input" placeholder="ООО Пример"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Тип</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="form-input">
                {['Крупный бизнес','МСП','Холдинг','Международные'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="field-label">Отрасль</label><input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className="form-input" placeholder="Агропром, IT..."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">ИНН</label><input value={form.inn} onChange={e=>setForm({...form,inn:e.target.value})} className="form-input" placeholder="1234567890"/></div>
            <div><label className="field-label">Город</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="form-input"/></div>
          </div>
          {/* Контакты */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Телефон</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="form-input" placeholder="+998 90 000-00-00"/></div>
            <div><label className="field-label">Email</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="form-input" placeholder="info@company.uz"/></div>
          </div>
          {/* Менеджер и статус */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Менеджер</label><input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="form-input" placeholder="Иванов И.И."/></div>
            <div><label className="field-label">Статус</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="form-input">
                <option value="active">Активный</option>
                <option value="pending">На рассмотрении</option>
                <option value="inactive">Неактивный</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Сегмент</label>
              <select value={form.segment} onChange={e=>setForm({...form,segment:e.target.value})} className="form-input">
                <option>Standard</option><option>Premium</option>
              </select>
            </div>
            <div><label className="field-label">Уровень риска</label>
              <select value={form.risk_level} onChange={e=>setForm({...form,risk_level:e.target.value})} className="form-input">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>
          {/* Финансы */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Рейтинг</label><input value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} className="form-input" placeholder="A+, A, B..."/></div>
            <div><label className="field-label">Сотрудники</label><input value={form.employees} onChange={e=>setForm({...form,employees:e.target.value})} className="form-input" placeholder="500 чел."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Выручка</label><input value={form.revenue} onChange={e=>setForm({...form,revenue:e.target.value})} className="form-input" placeholder="100 млрд UZS"/></div>
            <div><label className="field-label">Кредитный лимит</label><input value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})} className="form-input" placeholder="10 млрд UZS"/></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
