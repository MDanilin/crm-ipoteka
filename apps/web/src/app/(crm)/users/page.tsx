'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User, UserRole } from '@crm/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const ROLE_L: Record<UserRole, string> = {
  admin: 'Администратор', supervisor: 'Руководитель',
  manager: 'Менеджер', analyst: 'Аналитик', agent: 'Агент', operator: 'Оператор', dsa: 'DSA',
};

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
        <div className="text-5xl mb-6">🔒</div>
        <h2 className="text-2xl font-semibold tracking-[-0.04em] mb-2">Недостаточно прав</h2>
        <p className="text-[#aaa] text-base">Управление пользователями доступно только администраторам и руководителям</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">Сотрудники</h1>
          <p className="mt-4 text-base text-[#aaa]">{users.length} пользователей в системе</p>
        </div>
        {canAdmin && <Button onClick={() => setOpen(true)}>+ Пользователь</Button>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#f6f6f6] text-xs font-bold uppercase tracking-[0.08em] text-[#999]">
              <th className="rounded-l-xl px-5 py-4">Сотрудник</th>
              <th className="px-5 py-4">Телефон / Логин</th>
              <th className="px-5 py-4">Роль</th>
              <th className="px-5 py-4">Отдел</th>
              <th className="px-5 py-4">Клиентов</th>
              <th className="px-5 py-4">Статус</th>
              <th className="px-5 py-4">Последний вход</th>
              <th className="rounded-r-xl px-5 py-4"/>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#f0f0f0] hover:bg-[#fcf8f8] transition-colors">
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`grid size-10 place-items-center rounded-full text-xs font-bold flex-shrink-0 ${u.role === 'agent' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#f3dcd8] text-[#7c3f36]'}`}>
                      {u.initials}
                    </div>
                    <div className="text-sm font-semibold">{u.name}</div>
                  </div>
                </td>
                <td className="px-5 py-5 text-sm text-[#aaa]">
                  {u.role === 'agent'
                    ? <span className="font-mono text-[#555]">{(u as unknown as Record<string,string>).login || '—'}</span>
                    : ((u as unknown as Record<string,string>).phone || '—')
                  }
                </td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleStyles[u.role] ?? 'bg-[#f3f4f6] text-[#555]'}`}>
                    {ROLE_L[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-5 text-sm text-[#555]">{u.dept || '—'}</td>
                <td className="px-5 py-5 text-sm font-medium">{u.clients_count ?? 0}</td>
                <td className="px-5 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[u.status]}`}>
                    {u.status === 'active' ? 'Активный' : 'Неактивный'}
                  </span>
                </td>
                <td className="px-5 py-5 text-xs text-[#aaa]">{u.last_login || '—'}</td>
                <td className="px-5 py-5 text-right">
                  {canAdmin && u.id !== me?.id && (
                    <button onClick={() => setConfirmDel(u.id)} className="text-xs text-[#e1261c] hover:opacity-70 transition-opacity">Удалить</button>
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
        title={isAgent ? 'Новый агент / партнёр' : 'Новый сотрудник'}
        onClose={() => { setOpen(false); setForm({ ...EMPTY_FORM }); }}
        footer={<>
          <Button variant="ghost" onClick={() => { setOpen(false); setForm({ ...EMPTY_FORM }); }}>Отмена</Button>
          <Button onClick={() => create.mutate(form)} disabled={createDisabled}>Создать</Button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">Роль</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...EMPTY_FORM, role: e.target.value as UserRole })}
              className="form-input"
            >
              <option value="manager">Менеджер</option>
              <option value="operator">Оператор (кол-центр)</option>
              <option value="dsa">DSA (выездной сотрудник)</option>
              <option value="supervisor">Руководитель</option>
              <option value="analyst">Аналитик</option>
              <option value="admin">Администратор</option>
              <option value="agent">Агент / Партнёр</option>
            </select>
          </div>

          <div>
            <label className="field-label">{isAgent ? 'Название компании / Имя *' : 'Полное имя *'}</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="form-input"
              placeholder={isAgent ? 'ООО «Buhgalter Plus»' : 'Имя Фамилия Отчество'}
            />
          </div>

          {isAgent ? (
            /* Agent: login + password */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Логин *</label>
                <input
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  className="form-input"
                  placeholder="buhgalterplus"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="field-label">Пароль *</label>
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
            /* Staff: phone */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Телефон *</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="form-input"
                  placeholder="+998 90 000-00-00"
                />
              </div>
              <div>
                <label className="field-label">Отдел</label>
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
              <label className="field-label">Компания / Организация</label>
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
              Агент входит через портал по логину и паролю — не по телефону
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={confirmDel !== null} title="Удалить пользователя?" onClose={() => setConfirmDel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Отмена</Button>
          <Button variant="danger" onClick={() => confirmDel && del.mutate(confirmDel)} disabled={del.isPending}>Удалить</Button>
        </>}>
        <p className="text-sm text-[#555]">Это действие необратимо. Все данные пользователя будут удалены.</p>
      </Modal>
    </div>
  );
}
