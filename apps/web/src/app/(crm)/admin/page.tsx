'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface FieldConfig {
  id: number;
  entity: string;
  field: string;
  label: string;
  required: number;
  visible: number;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  number: string;
  limit_val: string;
  used_val: string;
  rate: string;
  status: string;
  opened: string;
  expires: string;
}

interface Company {
  id: number;
  name: string;
  short_name: string;
  type: string;
  inn: string;
  industry: string;
  city: string;
  manager: string;
  status: string;
  segment: string;
  risk_level: string;
  credit_limit: string;
  revenue: string;
  created_at: string;
  products_count: number;
  products: Product[];
}

const ENTITY_LABELS: Record<string, string> = { lead: 'Лиды', client: 'Клиенты' };
const FIELD_NAME_LABELS: Record<string, string> = {
  name: 'Название', inn: 'ИНН', pinfl: 'ПИНФЛ', contact: 'Контакт',
  phone: 'Телефон', product: 'Продукт', source: 'Источник', manager: 'Менеджер',
  amount: 'Сумма', type: 'Тип', industry: 'Отрасль', city: 'Город',
  email: 'Email', segment: 'Сегмент', risk_level: 'Уровень риска',
  rating: 'Рейтинг', revenue: 'Выручка', credit_limit: 'Кредитный лимит', employees: 'Сотрудников',
};

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-[#dcfce7] text-[#166534]',
  inactive: 'bg-[#f3f4f6] text-[#6b7280]',
  pending:  'bg-[#fef9c3] text-[#854d0e]',
};
const RISK_STYLES: Record<string, string> = {
  low:    'bg-[#dcfce7] text-[#166534]',
  medium: 'bg-[#fef9c3] text-[#854d0e]',
  high:   'bg-[#fee2e2] text-[#991b1b]',
};
const PROD_STATUS: Record<string, string> = {
  active:   'bg-[#dcfce7] text-[#166534]',
  inactive: 'bg-[#fee2e2] text-[#991b1b]',
  closed:   'bg-[#f3f4f6] text-[#6b7280]',
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#111]' : 'bg-[#e5e5e5]'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function AdminPage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();
  const [tab,          setTab]         = useState<'fields' | 'companies'>('fields');
  const [entity,       setEntity]      = useState<'lead' | 'client'>('lead');
  const [localConfigs, setLocalConfigs] = useState<FieldConfig[] | null>(null);
  const [saved,        setSaved]        = useState(false);
  const [expandedId,   setExpandedId]   = useState<number | null>(null);

  const canEdit   = user?.role === 'admin';
  const canView   = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'analyst';

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 flex size-[52px] items-center justify-center rounded-[14px] bg-[#f5f5f5] border border-[#f0f0f0]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 className="text-base font-semibold tracking-[-0.03em] mb-1.5">Нет доступа</h2>
        <p className="text-[13px] text-[#aaa]">Раздел доступен администратору, руководителю и аналитику</p>
      </div>
    );
  }

  const { data: allConfigs = [], isLoading: cfgLoading } = useQuery<FieldConfig[]>({
    queryKey: ['admin-field-config'],
    queryFn:  () => api.get('/admin/field-config'),
    enabled:  canEdit,
  });

  const { data: companies = [], isLoading: compLoading } = useQuery<Company[]>({
    queryKey: ['admin-companies'],
    queryFn:  () => api.get('/admin/companies'),
    enabled:  tab === 'companies',
  });

  const saveConfigs = useMutation({
    mutationFn: (configs: FieldConfig[]) => api.put('/admin/field-config', { configs }),
    onSuccess: (updated: FieldConfig[]) => {
      qc.setQueryData(['admin-field-config'], updated);
      setLocalConfigs(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const configs     = localConfigs ?? allConfigs;
  const entityCfgs  = configs.filter(c => c.entity === entity);
  const isDirty     = localConfigs !== null;

  function updateField(field: string, key: 'label' | 'required' | 'visible', value: string | boolean) {
    const base = localConfigs ?? allConfigs;
    setLocalConfigs(base.map(c =>
      (c.entity === entity && c.field === field) ? { ...c, [key]: value } : c
    ));
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(36px,4vw,60px)] font-semibold leading-none tracking-[-0.08em]">Админка</h1>
          <p className="mt-4 text-base text-[#aaa]">Конфигурация системы и просмотр данных</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#f0f0f0] mb-8">
        {([
          ['fields',    'Поля форм'],
          ['companies', 'Компании'],
        ] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-[#111] text-[#111]'
                : 'border-transparent text-[#aaa] hover:text-[#666]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Field Config ─────────────────────────────── */}
      {tab === 'fields' && (
        <div>
          {!canEdit && (
            <div className="mb-6 rounded-2xl bg-[#fef9c3] px-5 py-3 text-sm text-[#854d0e]">
              Только администратор может изменять конфигурацию полей.
            </div>
          )}

          {canEdit && saved && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3 text-sm font-medium text-[#166534]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/>
              </svg>
              Конфигурация сохранена
            </div>
          )}

          {/* Entity selector */}
          <div className="flex gap-2 mb-6">
            {(['lead', 'client'] as const).map(e => (
              <button
                key={e}
                onClick={() => setEntity(e)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  entity === e ? 'bg-[#111] text-white' : 'bg-[#f5f5f5] text-[#555] hover:bg-[#ececec]'
                }`}
              >
                {ENTITY_LABELS[e]}
              </button>
            ))}
          </div>

          <p className="text-sm text-[#aaa] mb-4">
            Настройте какие поля показываются в форме создания и какие обязательны для заполнения.
            Поле «Название» всегда обязательно.
          </p>

          {cfgLoading ? (
            <div className="text-sm text-[#aaa] py-8">Загрузка...</div>
          ) : (
            <div className="rounded-2xl border border-[#f0f0f0] overflow-hidden">
              <table className="crm-table min-w-[600px]">
                <colgroup>
                  <col className="w-[22%]"/>
                  <col className="w-[38%]"/>
                  <col className="w-[20%]"/>
                  <col className="w-[20%]"/>
                </colgroup>
                <thead>
                  <tr>
                    <th>Поле</th>
                    <th>Название в интерфейсе</th>
                    <th>Обязательное</th>
                    <th>Видимое</th>
                  </tr>
                </thead>
                <tbody>
                  {entityCfgs.map(cfg => {
                    const isNameField = cfg.field === 'name';
                    return (
                      <tr key={cfg.field}>
                        <td>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[11px] font-mono text-[#555]">
                            {cfg.field}
                          </span>
                        </td>
                        <td>
                          {canEdit ? (
                            <input
                              value={cfg.label}
                              onChange={e => updateField(cfg.field, 'label', e.target.value)}
                              disabled={isNameField}
                              className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          ) : (
                            <span className="text-sm">{cfg.label}</span>
                          )}
                        </td>
                        <td>
                          {canEdit ? (
                            <Toggle
                              checked={!!cfg.required}
                              onChange={v => isNameField ? null : updateField(cfg.field, 'required', v)}
                            />
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.required ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                              {cfg.required ? 'Да' : 'Нет'}
                            </span>
                          )}
                        </td>
                        <td>
                          {canEdit ? (
                            <Toggle
                              checked={!!cfg.visible}
                              onChange={v => isNameField ? null : updateField(cfg.field, 'visible', v)}
                            />
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.visible ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                              {cfg.visible ? 'Да' : 'Нет'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {canEdit && (
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => saveConfigs.mutate(entityCfgs)}
                disabled={!isDirty || saveConfigs.isPending}
                className="flex h-11 items-center gap-2 rounded-full bg-[#111] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveConfigs.isPending ? 'Сохраняем...' : 'Сохранить'}
              </button>
              {isDirty && (
                <button
                  onClick={() => setLocalConfigs(null)}
                  className="h-11 rounded-full border border-[#e5e5e5] px-5 text-sm font-medium text-[#555] hover:bg-[#f8f8f8] transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Companies ────────────────────────────────── */}
      {tab === 'companies' && (
        <div>
          {compLoading ? (
            <div className="text-sm text-[#aaa] py-8">Загрузка...</div>
          ) : (
            <div>
              <p className="text-sm text-[#aaa] mb-4">{companies.length} компаний в базе</p>
              <div className="space-y-2">
                {companies.map(c => {
                  const isOpen = expandedId === c.id;
                  return (
                    <div key={c.id} className="rounded-2xl border border-[#f0f0f0] bg-white overflow-hidden">
                      {/* Company row */}
                      <button
                        onClick={() => setExpandedId(isOpen ? null : c.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors"
                      >
                        {/* Avatar */}
                        <div className="grid size-10 place-items-center rounded-full bg-[#f3dcd8] text-xs font-bold text-[#7c3f36] flex-shrink-0">
                          {c.short_name || c.name.slice(0, 2).toUpperCase()}
                        </div>
                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{c.name}</div>
                          <div className="text-xs text-[#aaa] mt-0.5 truncate">
                            {[c.industry, c.city, c.inn && `ИНН ${c.inn}`].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        {/* Segment + status */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {c.products_count > 0 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#555]">
                              {c.products_count} продукт{c.products_count > 1 ? 'а' : ''}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[c.status] ?? 'bg-[#f3f4f6] text-[#555]'}`}>
                            {c.status === 'active' ? 'Активный' : c.status === 'pending' ? 'На рассмотрении' : 'Неактивный'}
                          </span>
                          {c.risk_level && c.risk_level !== 'low' && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${RISK_STYLES[c.risk_level]}`}>
                              {c.risk_level === 'high' ? 'Высокий риск' : 'Средний риск'}
                            </span>
                          )}
                          {/* Chevron */}
                          <svg className={`transition-transform duration-200 text-[#ccc] ${isOpen ? 'rotate-90' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>

                      {/* Expanded: products + details */}
                      {isOpen && (
                        <div className="border-t border-[#f5f5f5] px-5 py-4 bg-[#fafafa]">
                          {/* Details row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">Менеджер</div>
                              <div className="text-sm font-medium">{c.manager || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">Выручка</div>
                              <div className="text-sm font-medium">{c.revenue || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">Кредитный лимит</div>
                              <div className="text-sm font-medium">{c.credit_limit || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">Сегмент</div>
                              <div className="text-sm font-medium">{c.segment || '—'}</div>
                            </div>
                          </div>

                          {/* Products */}
                          {c.products.length > 0 ? (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#bbb] font-semibold mb-2">Продукты / Вложения</div>
                              <div className="space-y-2">
                                {c.products.map((p, i) => (
                                  <div key={p.id ?? i} className="flex items-center gap-3 rounded-xl bg-white border border-[#f0f0f0] px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-semibold truncate">{p.name}</div>
                                      {p.number && <div className="text-xs text-[#aaa] mt-0.5">№ {p.number}</div>}
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                                      {p.limit_val && p.limit_val !== '—' && (
                                        <div className="text-right">
                                          <div className="text-[10px] text-[#aaa]">Лимит</div>
                                          <div className="font-semibold">{p.limit_val}</div>
                                        </div>
                                      )}
                                      {p.used_val && p.used_val !== '—' && (
                                        <div className="text-right">
                                          <div className="text-[10px] text-[#aaa]">Использовано</div>
                                          <div className="font-semibold">{p.used_val}</div>
                                        </div>
                                      )}
                                      {p.rate && p.rate !== '—' && (
                                        <div className="text-right">
                                          <div className="text-[10px] text-[#aaa]">Ставка</div>
                                          <div className="font-semibold">{p.rate}</div>
                                        </div>
                                      )}
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${PROD_STATUS[p.status] ?? 'bg-[#f3f4f6] text-[#555]'}`}>
                                        {p.status === 'active' ? 'Активный' : p.status === 'closed' ? 'Закрыт' : 'Неактивный'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-[#ccc]">Продуктов не добавлено</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
