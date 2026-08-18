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
import { Badge } from '@/components/ui/Badge';

// roles resolved via t() below

// Роль — категория сотрудника, не критичность, поэтому variant подобран
// по типографической иерархии (purple для админа как самой "тяжёлой"
// роли, остальное — обычный/приглушённый текст), а не по цветовому коду.
const roleStyles: Record<UserRole, 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray'> = {
  admin:      'purple',
  supervisor: 'blue',
  manager:    'green',
  analyst:    'gray',
  agent:      'orange',
  operator:   'blue',
  dsa:        'gray',
};

// active/inactive — это состояние, а не ошибка: green для активного
// обычным текстом, gray для деактивированного (приглушённо, не красным).
const statusStyles: Record<string, 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray'> = {
  active:   'green',
  inactive: 'gray',
};

const BLOCKS = ['', 'MSE', 'Middle', 'Large', 'Int'] as const;
const BLOCK_LABELS: Record<string, string> = { MSE: 'MSE', Middle: 'Middle', Large: 'Large', Int: 'Int' };
// Блок банка — чисто категориальная метка, без критичности, поэтому все
// варианты сведены к нейтральному gray (все рендерятся как обычный текст).
const BLOCK_COLORS: Record<string, 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray'> = {
  MSE:    'gray',
  Middle: 'gray',
  Large:  'gray',
  Int:    'gray',
};

const EMPTY_FORM = { name: '', phone: '', login: '', password: '', role: 'manager' as UserRole, dept: '', block: '', branch: '' };
const EMPTY_EDIT = { name: '', role: 'manager' as UserRole, dept: '', status: 'active', block: '', branch: '', password: '' };

export default function UsersPage() {
  const me  = useAuthStore(s => s.user);
  const qc  = useQueryClient();
  const { t } = useTranslation();
  const [open,       setOpen]       = useState(false);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [editing,    setEditing]    = useState<User | null>(null);
  const [editForm,   setEditForm]   = useState({ ...EMPTY_EDIT });

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

  const update = useMutation({
    mutationFn: (body: typeof editForm) => api.put(`/users/${editing?.id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditing(null); },
  });

  const openEdit = (u: User) => {
    setEditing(u);
    setEditForm({
      name:   u.name,
      role:   u.role,
      dept:   u.dept || '',
      status: u.status,
      block:  (u as any).block  || '',
      branch: (u as any).branch || '',
      password: '',
    });
  };

  const isAgent = form.role === 'agent';

  const createDisabled = !form.name || create.isPending
    || (isAgent ? !form.login || !form.password : !form.phone);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] mb-2">{t('common.accessDenied')}</h2>
        <p className="text-g60 text-base">{t('common.accessDeniedDesc')}</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-g60 text-sm">{t('common.loading')}</div>;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">{t('users.title')}</h1>
          <p className="mt-4 text-base text-g60">{t('users.total', { count: users.length })}</p>
        </div>
        {canAdmin && <Button onClick={() => setOpen(true)}>{t('users.newBtn')}</Button>}
      </div>

      <div className="overflow-x-auto">
        <table className="crm-table min-w-[900px]">
          <thead>
            <tr>
              <th className="min-w-[200px]">{t('users.colEmployee')}</th>
              <th className="min-w-[110px]">{t('users.colRole')}</th>
              <th className="min-w-[130px]">{t('users.colDept')}</th>
              <th className="min-w-[90px]">Блок</th>
              <th className="min-w-[110px]">Филиал</th>
              <th className="min-w-[90px]">{t('users.colClients')}</th>
              <th className="min-w-[100px]">{t('users.colStatus')}</th>
              <th className="min-w-[100px]">{t('users.colLastLogin')}</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} onClick={() => openEdit(u)} className="cursor-pointer">
                {/* Сотрудник — имя + телефон/логин в две строки, без обрезки
                    (см. рефернс Rocket Work: "Иванов Максим" / "+7 999..."). */}
                <td>
                  <p className="text-sm font-semibold leading-snug">{u.name}</p>
                  <p className="mt-0.5 text-xs text-g60">
                    {u.role === 'agent'
                      ? <span className="font-mono">{(u as unknown as Record<string,string>).login || '—'}</span>
                      : ((u as unknown as Record<string,string>).phone || '—')
                    }
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  <Badge variant={roleStyles[u.role] ?? 'gray'}>
                    {t(`common.roles.${u.role}`)}
                  </Badge>
                </td>
                <td className="max-w-[160px]">
                  <span className="block truncate text-sm text-g80" title={u.dept || ''}>{u.dept || '—'}</span>
                </td>
                <td className="whitespace-nowrap">
                  {(u as any).block ? (
                    <Badge variant={BLOCK_COLORS[(u as any).block] ?? 'gray'}>
                      {(u as any).block}
                    </Badge>
                  ) : <span className="text-sm text-g40">—</span>}
                </td>
                <td className="max-w-[140px]">
                  <span className="block truncate text-sm text-g80" title={(u as any).branch || ''}>{(u as any).branch || '—'}</span>
                </td>
                <td className="whitespace-nowrap text-sm font-medium">{u.clients_count ?? 0}</td>
                <td className="whitespace-nowrap">
                  <Badge variant={statusStyles[u.status] ?? 'gray'}>
                    {t(`common.status.${u.status}`)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap text-xs text-g60">{u.last_login || '—'}</td>
                <td className="text-right whitespace-nowrap">
                  {canAdmin && u.id !== me?.id && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDel(u.id); }}
                      className="text-xs text-dn hover:opacity-70 transition-opacity"
                    >{t('users.deleteBtn')}</button>
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
            <>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Блок доступа</label>
                  <select
                    value={form.block}
                    onChange={e => setForm({ ...form, block: e.target.value })}
                    className="form-input"
                  >
                    <option value="">— без ограничений —</option>
                    <option value="MSE">MSE (МСП)</option>
                    <option value="Middle">Middle (Средний)</option>
                    <option value="Large">Large (Крупный)</option>
                    <option value="Int">Int (Международный)</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Филиал</label>
                  <input
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    className="form-input"
                    placeholder="Ташкентский филиал"
                  />
                </div>
              </div>
              {form.block && (
                <div className="rounded-xl bg-warn-bg px-4 py-3 text-sm text-warn">
                  Сотрудник будет видеть только клиентов блока <strong>{form.block}</strong>
                  {form.branch && <> из филиала <strong>{form.branch}</strong></>}.
                </div>
              )}
            </>
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
            <div className="rounded-xl bg-warn-bg px-4 py-3 text-sm text-warn">
              {t('users.agentNote')}
            </div>
          )}
        </div>
      </Modal>

      {/* Карточка сотрудника — быстрое модальное окно вместо отдельной
          страницы (клик по строке). Редактирование доступно только admin
          (совпадает с правами PUT /users/:id на бэкенде); supervisor
          видит те же поля, но в режиме просмотра. */}
      <Modal
        open={editing !== null}
        title={editing?.name || ''}
        onClose={() => setEditing(null)}
        footer={canAdmin ? <>
          <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button onClick={() => update.mutate(editForm)} disabled={!editForm.name || update.isPending}>
            {update.isPending ? t('common.saving', { defaultValue: 'Сохранение…' }) : t('common.save', { defaultValue: 'Сохранить' })}
          </Button>
        </> : <Button variant="ghost" onClick={() => setEditing(null)}>{t('common.close', { defaultValue: 'Закрыть' })}</Button>}
      >
        {editing && (
          <div className="space-y-4">
            <div className="text-sm text-g60">
              {editing.role === 'agent'
                ? <span className="font-mono">{(editing as unknown as Record<string,string>).login || '—'}</span>
                : ((editing as unknown as Record<string,string>).phone || '—')
              }
            </div>

            <div>
              <label className="field-label">{t('users.fName')}</label>
              <input
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="form-input"
                disabled={!canAdmin}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('users.fRole')}</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="form-input"
                  disabled={!canAdmin}
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
                <label className="field-label">{t('users.colStatus')}</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="form-input"
                  disabled={!canAdmin}
                >
                  <option value="active">{t('common.status.active')}</option>
                  <option value="inactive">{t('common.status.inactive')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('users.fDept')}</label>
                <input
                  value={editForm.dept}
                  onChange={e => setEditForm({ ...editForm, dept: e.target.value })}
                  className="form-input"
                  disabled={!canAdmin}
                />
              </div>
              <div>
                <label className="field-label">{t('users.colClients')}</label>
                <input value={editing.clients_count ?? 0} className="form-input" disabled />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Блок доступа</label>
                <select
                  value={editForm.block}
                  onChange={e => setEditForm({ ...editForm, block: e.target.value })}
                  className="form-input"
                  disabled={!canAdmin}
                >
                  <option value="">— без ограничений —</option>
                  <option value="MSE">MSE (МСП)</option>
                  <option value="Middle">Middle (Средний)</option>
                  <option value="Large">Large (Крупный)</option>
                  <option value="Int">Int (Международный)</option>
                </select>
              </div>
              <div>
                <label className="field-label">Филиал</label>
                <input
                  value={editForm.branch}
                  onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                  className="form-input"
                  disabled={!canAdmin}
                />
              </div>
            </div>

            {canAdmin && (
              <div>
                <label className="field-label">Сбросить пароль (необязательно)</label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  className="form-input"
                  placeholder="Оставь пустым, чтобы не менять"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={confirmDel !== null} title={t('users.deleteTitle')} onClose={() => setConfirmDel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => confirmDel && del.mutate(confirmDel)} disabled={del.isPending}>{t('users.deleteBtn')}</Button>
        </>}>
        <p className="text-sm text-g80">{t('users.deleteConfirm')}</p>
      </Modal>
    </div>
  );
}
