'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User, UserRole } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// roles resolved via t() below

const roleStyles: Record<UserRole, string> = {
  admin:      'bg-[#ede9fe] text-[#6d28d9]',
  supervisor: 'bg-[#dbeafe] text-[#1d4ed8]',
  manager:    'bg-[#dcfce7] text-[#166534]',
  analyst:    'bg-[#f3f4f6] text-[#374151]',
  agent:      'bg-[#fef3c7] text-[#92400e]',
  operator:   'bg-[#e0f2fe] text-[#0369a1]',
  dsa:        'bg-[#fce7f3] text-[#9d174d]',
};

const statusStyles: Record<string, string> = {
  active:   'bg-[#dcfce7] text-[#166534]',
  inactive: 'bg-[#f3f4f6] text-[#6b7280]',
};

const EMPTY_FORM = { name: '', phone: '', login: '', password: '', role: 'manager' as UserRole, dept: '' };

export default function UsersPage() {
  const me  = useAuthStore(s => s.user);
  const qc  = useQueryClient();
  const { t } = useTranslation();
  const [open,       setOpen]       = useState(false);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const allowed  = me?.role === 'admin' || me?.role === 'supervisor';
  const canAdmin = me?.role === 'admin';

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn:  () => api.get('/users'),
    enabled: !!allowed,
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post('/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setConfirmDel(null); },
  });

  const isAgent = form.role === 'agent';

  const createDisabled = !form.name || create.isPending
    || (isAgent ? !form.login || !form.password : !form.phone);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] mb-2">{t('common.accessDenied')}</h2>
        <p className="text-[#aaa] text-base">{t('common.accessDeniedDesc')}</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">{t('common.loading')}</div>;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('users.title')}</h1>
          <p className="mt-4 text-base text-[#aaa]">{t('users.total', { count: users.length })}</p>
        </div>
        {canAdmin && <Button onClick={() => setOpen(true)}>{t('users.newBtn')}</Button>}
      </div>

      <div className="overflow-x-auto">
        <table className="crm-table min-w-[800px]">
          <colgroup>
            <col className="w-[24%]"/>
            <col className="w-[16%]"/>
            <col className="w-[13%]"/>
            <col className="w-[14%]"/>
            <col className="w-[8%]"/>
            <col className="w-[10%]"/>
            <col className="w-[12%]"/>
            <col className="w-[3%]"/>
          </colgroup>
          <thead>
            <tr>
              <th>{t('users.colEmployee')}</th>
              <th>{t('users.colContact')}</th>
              <th>{t('users.colRole')}</th>
              <th>{t('users.colDept')}</th>
              <th>{t('users.colClients')}</th>
              <th>{t('users.colStatus')}</th>
              <th>{t('users.colLastLogin')}</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="max-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`grid size-10 place-items-center rounded-full text-xs font-bold flex-shrink-0 ${u.role === 'agent' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#f3dcd8] text-[#7c3f36]'}`}>
                      {u.initials}
                    </div>
                    <div className="text-sm font-semibold truncate">{u.name}</div>
                  </div>
                </td>
                <td className="text-sm text-[#aaa] truncate max-w-0">
                  {u.role === 'agent'
                    ? <span className="font-mono text-[#555]">{(u as unknown as Record<string,string>).login || '—'}</span>
                    : ((u as unknown as Record<string,string>).phone || '—')
                  }
                </td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleStyles[u.role] ?? 'bg-[#f3f4f6] text-[#555]'}`}>
                    {t(`common.roles.${u.role}`)}
                  </span>
                </td>
                <td className="text-sm text-[#555] truncate max-w-0">{u.dept || '—'}</td>
                <td className="text-sm font-medium">{u.clients_count ?? 0}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[u.status]}`}>
                    {t(`common.status.${u.status}`)}
                  </span>
                </td>
                <td className="text-xs text-[#aaa]">{u.last_login || '—'}</td>
                <td className="text-right">
                  {canAdmin && u.id !== me?.id && (
                    <button onClick={() => setConfirmDel(u.id)} className="text-xs text-[#e1261c] hover:opacity-70 transition-opacity">{t('users.deleteBtn')}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal
        open={open}
        title={isAgent ? t('users.formTitleAgent') : t('users.formTitleStaff')}
        onClose={() => { setOpen(false); setForm({ ...EMPTY_FORM }); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setOpen(false); setForm({ ...EMPTY_FORM }); }}>{t('common.cancel')}</Button>
          <Button onClick={() => create.mutate(form)} disabled={createDisabled}>{t('users.createBtn')}</Button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">{t('users.fRole')}</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...EMPTY_FORM, role: e.target.value as UserRole })}
              className="form-input"
            >
              <option value="manager">{t('common.roles.manager')}</option>
              <option value="operator">{t('common.roles.operator')}</option>
              <option value="dsa">{t('common.roles.dsa')}</option>
              <option value="supervisor">{t('common.roles.supervisor')}</option>
              <option value="analyst">{t('common.roles.analyst')}</option>
              <option value="admin">{t('common.roles.admin')}</option>
              <option value="agent">{t('common.roles.agent')}</option>
            </select>
          </div>

          <div>
            <label className="field-label">{isAgent ? t('users.fNameAgent') : t('users.fName')}</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="form-input"
              placeholder={isAgent ? 'ООО «Buhgalter Plus»' : 'Имя Фамилия Отчество'}
            />
          </div>

          {isAgent ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('users.fLogin')}</label>
                <input
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  className="form-input"
                  placeholder="buhgalterplus"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="field-label">{t('users.fPassword')}</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="form-input"
                  placeholder="Временный пароль"
                  autoComplete="off"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('users.fPhone')}</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="form-input"
                  placeholder="+998 90 000-00-00"
                />
              </div>
              <div>
                <label className="field-label">{t('users.fDept')}</label>
                <input
                  value={form.dept}
                  onChange={e => setForm({ ...form, dept: e.target.value })}
                  className="form-input"
                  placeholder="Корпоративный блок"
                />
              </div>
            </div>
          )}

          {isAgent && (
            <div>
              <label className="field-label">{t('users.fOrg')}</label>
              <input
                value={form.dept}
                onChange={e => setForm({ ...form, dept: e.target.value })}
                className="form-input"
                placeholder="Название организации агента"
              />
            </div>
          )}

          {isAgent && (
            <div className="rounded-xl bg-[#fef9c3] px-4 py-3 text-sm text-[#92400e]">
              {t('users.agentNote')}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={confirmDel !== null} title={t('users.deleteTitle')} onClose={() => setConfirmDel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => confirmDel && del.mutate(confirmDel)} disabled={del.isPending}>{t('users.deleteBtn')}</Button>
        </>}>
        <p className="text-sm text-[#555]">{t('users.deleteConfirm')}</p>
      </Modal>
    </div>
  );
}
