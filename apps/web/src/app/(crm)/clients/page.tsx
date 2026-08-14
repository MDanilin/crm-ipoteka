'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
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
  const { t }  = useTranslation();
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

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">{t('common.loading')}</div>;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('clients.title')}</h1>
          <p className="mt-4 text-base text-[#aaa]">{t('clients.subtitle')}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{t('clients.newBtn')}</Button>
      </div>

      {/* Count row */}
      <div className="mb-5 flex items-center justify-between border-y border-[#eee] py-4">
        <span className="text-sm font-semibold">{t('clients.total', { count: clients.length })}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="crm-table min-w-[800px]">
          <colgroup>
            <col className="w-[30%]"/>
            <col className="w-[14%]"/>
            <col className="w-[18%]"/>
            <col className="w-[16%]"/>
            <col className="w-[12%]"/>
            <col className="w-[10%]"/>
          </colgroup>
          <thead>
            <tr>
              <th>{t('clients.colClient')}</th>
              <th>{t('clients.colType')}</th>
              <th>{t('clients.colIndustry')}</th>
              <th>{t('clients.colManager')}</th>
              <th>{t('clients.colSegment')}</th>
              <th>{t('clients.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="cursor-pointer"
              >
                <td className="max-w-0">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-[#f3dcd8] text-xs font-bold text-[#7c3f36] flex-shrink-0">
                      {c.short_name || c.name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-[#aaa] mt-0.5 truncate">{c.city}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#555]">{c.type}</span>
                </td>
                <td className="text-sm text-[#555] truncate max-w-0">{c.industry || '—'}</td>
                <td className="text-sm truncate max-w-0">{c.manager || '—'}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.segment === 'Premium' ? 'bg-[#ede9fe] text-[#6d28d9]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{c.segment}</span>
                </td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[c.status] ?? 'bg-[#f3f4f6] text-[#555]'}`}>{t(`common.status.${c.status}`)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={t('clients.formTitle')} onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => create.mutate(form)} disabled={!form.name || create.isPending}>
            {create.isPending ? t('common.creating') : t('clients.createBtn')}
          </Button>
        </>}>
        <div className="space-y-4">
          <div><label className="field-label">{t('clients.fName')}</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="form-input" placeholder="ООО Пример"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fType')}</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="form-input">
                {['Крупный бизнес','МСП','Холдинг','Международные'].map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div><label className="field-label">{t('clients.fIndustry')}</label><input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className="form-input" placeholder="Агропром, IT..."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fInn')}</label><input value={form.inn} onChange={e=>setForm({...form,inn:e.target.value})} className="form-input" placeholder="1234567890"/></div>
            <div><label className="field-label">{t('clients.fCity')}</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="form-input"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fPhone')}</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="form-input" placeholder="+998 90 000-00-00"/></div>
            <div><label className="field-label">{t('clients.fEmail')}</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="form-input" placeholder="info@company.uz"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fManager')}</label><input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="form-input" placeholder="Иванов И.И."/></div>
            <div><label className="field-label">{t('clients.fStatus')}</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="form-input">
                <option value="active">{t('common.status.active')}</option>
                <option value="pending">{t('common.status.pending')}</option>
                <option value="inactive">{t('common.status.inactive')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fSegment')}</label>
              <select value={form.segment} onChange={e=>setForm({...form,segment:e.target.value})} className="form-input">
                <option>Standard</option><option>Premium</option>
              </select>
            </div>
            <div><label className="field-label">{t('clients.fRisk')}</label>
              <select value={form.risk_level} onChange={e=>setForm({...form,risk_level:e.target.value})} className="form-input">
                <option value="low">{t('common.risk.low')}</option>
                <option value="medium">{t('common.risk.medium')}</option>
                <option value="high">{t('common.risk.high')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fRating')}</label><input value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} className="form-input" placeholder="A+, A, B..."/></div>
            <div><label className="field-label">{t('clients.fEmployees')}</label><input value={form.employees} onChange={e=>setForm({...form,employees:e.target.value})} className="form-input" placeholder="500 чел."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clients.fRevenue')}</label><input value={form.revenue} onChange={e=>setForm({...form,revenue:e.target.value})} className="form-input" placeholder="100 млрд UZS"/></div>
            <div><label className="field-label">{t('clients.fCreditLimit')}</label><input value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})} className="form-input" placeholder="10 млрд UZS"/></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
