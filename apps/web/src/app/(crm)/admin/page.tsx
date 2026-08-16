'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Badge } from '@/components/ui/Badge';

interface FieldConfig {
  id: number;
  entity: string;
  field: string;
  label: string;
  required: number;
  visible: number;
  sort_order: number;
  field_type: string;
  placeholder: string;
  validation_regex: string;
  min_length: number;
  max_length: number;
  options: string;
  is_custom: number;
}

interface Product { id: number; name: string; number: string; limit_val: string; used_val: string; rate: string; status: string; opened: string; expires: string; }
interface Company { id: number; name: string; short_name: string; type: string; inn: string; industry: string; city: string; manager: string; status: string; segment: string; risk_level: string; credit_limit: string; revenue: string; created_at: string; products_count: number; products: Product[]; }

const ENTITY_LABELS: Record<string, string> = { lead: 'Лиды', client: 'Клиенты' };
const STATUS_STYLES: Record<string, 'green' | 'orange' | 'gray'> = { active: 'green', inactive: 'gray', pending: 'orange' };
const RISK_STYLES: Record<string, 'green' | 'orange' | 'red'>     = { low: 'green', medium: 'orange', high: 'red' };
const PROD_STATUS: Record<string, 'green' | 'red' | 'gray'>        = { active: 'green', inactive: 'red', closed: 'gray' };

const FIELD_TYPES = [
  { value: 'text',     label: 'Текст' },
  { value: 'number',   label: 'Число' },
  { value: 'phone',    label: 'Телефон' },
  { value: 'date',     label: 'Дата' },
  { value: 'select',   label: 'Список' },
  { value: 'textarea', label: 'Многострочный' },
];

const EMPTY_ADD = { label: '', field: '', field_type: 'text', required: false, visible: true, placeholder: '', options: '' };

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#111]' : 'bg-[#e5e5e5]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function typeLabel(t: string) { return FIELD_TYPES.find(f => f.value === t)?.label ?? t; }

function parseOpts(raw: string): string[] {
  try { const p = JSON.parse(raw || '[]'); return Array.isArray(p) ? p : []; } catch { return []; }
}

export default function AdminPage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();

  const [tab,          setTab]         = useState<'fields' | 'companies'>('fields');
  const [entity,       setEntity]      = useState<'lead' | 'client'>('lead');
  const [localConfigs, setLocalConfigs] = useState<FieldConfig[] | null>(null);
  const [saved,        setSaved]        = useState(false);
  const [expandedId,   setExpandedId]   = useState<number | null>(null);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [addForm,      setAddForm]      = useState({ ...EMPTY_ADD });
  const [addErr,       setAddErr]       = useState('');
  const draggingId = useRef<number | null>(null);

  const canEdit = user?.role === 'admin';
  const canView = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'analyst';

  if (!canView) return (
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

  const { data: allConfigs = [], isLoading: cfgLoading } = useQuery<FieldConfig[]>({
    queryKey: ['admin-field-config'],
    queryFn:  () => api.get('/admin/field-config'),
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
      qc.invalidateQueries({ queryKey: ['field-config-lead'] });
      qc.invalidateQueries({ queryKey: ['field-config-client'] });
      setLocalConfigs(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const addField = useMutation({
    mutationFn: (body: typeof addForm & { entity: string }) => api.post('/admin/field-config', body),
    onSuccess: (updated: FieldConfig[]) => {
      qc.setQueryData(['admin-field-config'], updated);
      qc.invalidateQueries({ queryKey: [`field-config-${entity}`] });
      setShowAdd(false);
      setAddForm({ ...EMPTY_ADD });
      setAddErr('');
    },
    onError: (e: any) => setAddErr(e?.error ?? 'Ошибка создания поля'),
  });

  const deleteField = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/field-config/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-field-config'] });
      qc.invalidateQueries({ queryKey: [`field-config-${entity}`] });
    },
  });

  const configs    = localConfigs ?? allConfigs;
  const entityCfgs = configs.filter(c => c.entity === entity).sort((a, b) => a.sort_order - b.sort_order);
  const isDirty    = localConfigs !== null;

  function updateField(field: string, key: keyof FieldConfig, value: string | number | boolean) {
    const base = localConfigs ?? allConfigs;
    setLocalConfigs(base.map(c => (c.entity === entity && c.field === field) ? { ...c, [key]: value } : c));
  }

  function handleDragOver(e: React.DragEvent, targetId: number) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.background = '#f0f4ff';
    el.style.outline = '2px solid #c7d2fe';
    el.style.outlineOffset = '-2px';
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      const el = e.currentTarget as HTMLElement;
      el.style.background = '';
      el.style.outline = '';
    }
  }

  function clearRowStyles() {
    document.querySelectorAll<HTMLElement>('.fc-row').forEach(el => {
      el.style.background = '';
      el.style.outline = '';
    });
  }

  function handleDrop(e: React.DragEvent, targetId: number) {
    e.preventDefault();
    clearRowStyles();
    const fromId = draggingId.current;
    if (fromId === null || fromId === targetId) return;

    const base = localConfigs ?? allConfigs;
    const entity_list = [...base.filter(c => c.entity === entity)].sort((a, b) => a.sort_order - b.sort_order);
    const others      = base.filter(c => c.entity !== entity);

    const fromIdx = entity_list.findIndex(c => c.id === fromId);
    const toIdx   = entity_list.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...entity_list];
    const [moved]   = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setLocalConfigs([...others, ...reordered.map((c, i) => ({ ...c, sort_order: i }))]);
    draggingId.current = null;
  }

  // Auto-generate slug from label
  function labelToSlug(s: string) {
    const map: Record<string, string> = {
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh',
      'з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o',
      'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
      'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    };
    return s.toLowerCase().split('').map(c => map[c] ?? c).join('')
      .replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
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
        {([['fields','Поля форм'],['companies','Компании']] as [string,string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === key ? 'border-[#111] text-[#111]' : 'border-transparent text-[#aaa] hover:text-[#666]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Field Config ─── */}
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
              <button key={e} onClick={() => { setEntity(e); setLocalConfigs(null); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${entity === e ? 'bg-[#111] text-white' : 'bg-[#f5f5f5] text-[#555] hover:bg-[#ececec]'}`}>
                {ENTITY_LABELS[e]}
              </button>
            ))}
          </div>

          {cfgLoading ? <div className="text-sm text-[#aaa] py-8">Загрузка...</div> : (
            <div className="rounded-2xl border border-[#f0f0f0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="crm-table min-w-[700px] w-full">
                  <colgroup>
                    {canEdit && <col className="w-8"/>}
                    <col className="w-[14%]"/>
                    <col className="w-[26%]"/>
                    <col className="w-[14%]"/>
                    <col/>
                    <col className="w-[11%]"/>
                    <col className="w-[11%]"/>
                    {canEdit && <col className="w-9"/>}
                  </colgroup>
                  <thead>
                    <tr>
                      {canEdit && <th/>}
                      <th>Поле</th>
                      <th>Название</th>
                      <th>Тип</th>
                      <th>Правила ввода</th>
                      <th>Обязат.</th>
                      <th>Видимое</th>
                      {canEdit && <th/>}
                    </tr>
                  </thead>
                  <tbody>
                    {entityCfgs.map(cfg => {
                      const isName = cfg.field === 'name';
                      const opts   = parseOpts(cfg.options);
                      return (
                        <tr
                          key={cfg.field}
                          className="fc-row"
                          draggable={canEdit}
                          onDragStart={() => { draggingId.current = cfg.id; }}
                          onDragOver={e => handleDragOver(e, cfg.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={e => handleDrop(e, cfg.id)}
                          onDragEnd={clearRowStyles}
                          style={{ cursor: canEdit ? 'default' : undefined }}
                        >
                          {/* Drag handle */}
                          {canEdit && (
                            <td className="px-3">
                              <span className="cursor-grab text-[#ccc] select-none hover:text-[#999]" title="Перетащить">≡</span>
                            </td>
                          )}

                          {/* Field slug */}
                          <td>
                            <span className={`font-mono text-[13px] px-2 py-0.5 rounded-md bg-[#f5f5f5] ${cfg.is_custom ? 'text-[#6d28d9]' : 'text-[#555]'}`}>
                              {cfg.field}
                            </span>
                          </td>

                          {/* Label */}
                          <td>
                            {canEdit ? (
                              <input
                                value={cfg.label}
                                onChange={e => updateField(cfg.field, 'label', e.target.value)}
                                disabled={isName}
                                className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            ) : <span className="text-sm">{cfg.label}</span>}
                          </td>

                          {/* Type */}
                          <td>
                            {canEdit ? (
                              <select
                                value={cfg.field_type || 'text'}
                                onChange={e => updateField(cfg.field, 'field_type', e.target.value)}
                                className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-2 text-sm outline-none focus:border-[#999] focus:bg-white"
                              >
                                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            ) : <span className="text-sm text-[#666]">{typeLabel(cfg.field_type)}</span>}
                          </td>

                          {/* Validation rules summary / edit button */}
                          <td>
                            {canEdit ? (
                              <button
                                onClick={() => setEditingField({ ...cfg })}
                                className="flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-[12px] text-[#666] hover:bg-[#f5f5f5] transition-colors"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                                </svg>
                                {cfg.validation_regex || cfg.min_length || cfg.max_length || (cfg.field_type === 'select' && opts.length > 0)
                                  ? <span className="font-semibold text-[#111]">Настроено</span>
                                  : 'Настроить'}
                              </button>
                            ) : (
                              <span className="text-xs text-[#bbb]">
                                {[
                                  cfg.min_length > 0 && `мин ${cfg.min_length}`,
                                  cfg.max_length > 0 && `макс ${cfg.max_length}`,
                                  cfg.validation_regex && 'regex',
                                  cfg.field_type === 'select' && opts.length > 0 && `${opts.length} вариантов`,
                                ].filter(Boolean).join(' · ') || '—'}
                              </span>
                            )}
                          </td>

                          {/* Required */}
                          <td>
                            {canEdit
                              ? <Toggle checked={!!cfg.required} onChange={v => !isName && updateField(cfg.field, 'required', v ? 1 : 0)} disabled={isName}/>
                              : <Badge variant={cfg.required ? 'green' : 'gray'}>{cfg.required ? 'Да' : 'Нет'}</Badge>
                            }
                          </td>

                          {/* Visible */}
                          <td>
                            {canEdit
                              ? <Toggle checked={!!cfg.visible} onChange={v => !isName && updateField(cfg.field, 'visible', v ? 1 : 0)} disabled={isName}/>
                              : <Badge variant={cfg.visible ? 'green' : 'gray'}>{cfg.visible ? 'Да' : 'Нет'}</Badge>
                            }
                          </td>

                          {/* Delete (custom only) */}
                          {canEdit && (
                            <td>
                              {cfg.is_custom ? (
                                <button
                                  onClick={() => { if (confirm(`Удалить поле «${cfg.label}»? Все данные будут потеряны.`)) deleteField.mutate(cfg.id); }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#ccc] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors"
                                  title="Удалить поле"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                                  </svg>
                                </button>
                              ) : <div className="w-8"/>}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                <button onClick={() => setLocalConfigs(null)}
                  className="h-11 rounded-full border border-[#e5e5e5] px-5 text-sm font-medium text-[#555] hover:bg-[#f8f8f8] transition-colors">
                  Отмена
                </button>
              )}
              <button
                onClick={() => { setAddForm({ ...EMPTY_ADD }); setAddErr(''); setShowAdd(true); }}
                className="ml-auto flex h-11 items-center gap-2 rounded-full border border-[#e5e5e5] px-5 text-sm font-semibold text-[#111] hover:bg-[#f5f5f5] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Добавить поле
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Companies ─── */}
      {tab === 'companies' && (
        <div>
          {compLoading ? <div className="text-sm text-[#aaa] py-8">Загрузка...</div> : (
            <div>
              <p className="text-sm text-[#aaa] mb-4">{companies.length} компаний в базе</p>
              <div className="space-y-2">
                {companies.map(c => {
                  const isOpen = expandedId === c.id;
                  return (
                    <div key={c.id} className="rounded-2xl border border-[#f0f0f0] bg-white overflow-hidden">
                      <button onClick={() => setExpandedId(isOpen ? null : c.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors">
                        <div className="grid size-10 place-items-center rounded-full bg-[#f3dcd8] text-xs font-bold text-[#7c3f36] flex-shrink-0">
                          {c.short_name || c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{c.name}</div>
                          <div className="text-xs text-[#aaa] mt-0.5 truncate">{[c.industry, c.city, c.inn && `ИНН ${c.inn}`].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {c.products_count > 0 && (
                            <Badge variant="gray">
                              {c.products_count} продукт{c.products_count > 1 ? 'а' : ''}
                            </Badge>
                          )}
                          <Badge variant={STATUS_STYLES[c.status] ?? 'gray'}>
                            {c.status === 'active' ? 'Активный' : c.status === 'pending' ? 'На рассмотрении' : 'Неактивный'}
                          </Badge>
                          {c.risk_level && c.risk_level !== 'low' && (
                            <Badge variant={RISK_STYLES[c.risk_level]}>
                              {c.risk_level === 'high' ? 'Высокий риск' : 'Средний риск'}
                            </Badge>
                          )}
                          <svg className={`transition-transform duration-200 text-[#ccc] ${isOpen ? 'rotate-90' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#f5f5f5] px-5 py-4 bg-[#fafafa]">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            {[['Менеджер', c.manager], ['Выручка', c.revenue], ['Кредитный лимит', c.credit_limit], ['Сегмент', c.segment]].map(([k, v]) => (
                              <div key={k}>
                                <div className="text-[10px] uppercase tracking-wider text-[#bbb] font-semibold mb-1">{k}</div>
                                <div className="text-sm font-medium">{v || '—'}</div>
                              </div>
                            ))}
                          </div>
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
                                      {p.limit_val && p.limit_val !== '—' && <div className="text-right"><div className="text-[10px] text-[#aaa]">Лимит</div><div className="font-semibold">{p.limit_val}</div></div>}
                                      {p.used_val && p.used_val !== '—' && <div className="text-right"><div className="text-[10px] text-[#aaa]">Использовано</div><div className="font-semibold">{p.used_val}</div></div>}
                                      {p.rate && p.rate !== '—' && <div className="text-right"><div className="text-[10px] text-[#aaa]">Ставка</div><div className="font-semibold">{p.rate}</div></div>}
                                      <Badge variant={PROD_STATUS[p.status] ?? 'gray'}>
                                        {p.status === 'active' ? 'Активный' : p.status === 'closed' ? 'Закрыт' : 'Неактивный'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : <div className="text-sm text-[#ccc]">Продуктов не добавлено</div>}
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

      {/* ─── Validation rules modal ─── */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingField(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">
                Правила для поля <span className="font-mono text-[13px] text-[#6d28d9] bg-[#ede9fe] px-2 py-0.5 rounded-md">{editingField.field}</span>
              </h2>
              <button onClick={() => setEditingField(null)} className="text-[#aaa] hover:text-[#555]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Placeholder */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Подсказка (placeholder)</label>
                <input
                  value={editingField.placeholder || ''}
                  onChange={e => setEditingField(f => f ? { ...f, placeholder: e.target.value } : f)}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                  placeholder="Введите текст подсказки..."
                />
              </div>

              {/* Min/Max for text fields */}
              {['text', 'phone', 'textarea'].includes(editingField.field_type) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Мин. длина</label>
                    <input type="number" min="0"
                      value={editingField.min_length || ''}
                      onChange={e => setEditingField(f => f ? { ...f, min_length: parseInt(e.target.value) || 0 } : f)}
                      className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Макс. длина</label>
                    <input type="number" min="0"
                      value={editingField.max_length || ''}
                      onChange={e => setEditingField(f => f ? { ...f, max_length: parseInt(e.target.value) || 0 } : f)}
                      className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Min/Max for number fields */}
              {editingField.field_type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Мин. значение</label>
                    <input type="number"
                      value={editingField.min_length || ''}
                      onChange={e => setEditingField(f => f ? { ...f, min_length: parseInt(e.target.value) || 0 } : f)}
                      className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Макс. значение</label>
                    <input type="number"
                      value={editingField.max_length || ''}
                      onChange={e => setEditingField(f => f ? { ...f, max_length: parseInt(e.target.value) || 0 } : f)}
                      className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Regex */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Regex-паттерн</label>
                <input
                  value={editingField.validation_regex || ''}
                  onChange={e => setEditingField(f => f ? { ...f, validation_regex: e.target.value } : f)}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm font-mono outline-none focus:border-[#999] focus:bg-white"
                  placeholder="^[a-zA-Z]+$"
                />
              </div>

              {/* Options for select */}
              {editingField.field_type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Варианты (по одному на строке)</label>
                  <textarea
                    rows={5}
                    value={parseOpts(editingField.options).join('\n')}
                    onChange={e => {
                      const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
                      setEditingField(f => f ? { ...f, options: JSON.stringify(lines) } : f);
                    }}
                    className="w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[#999] focus:bg-white resize-none"
                    placeholder={'Вариант 1\nВариант 2\nВариант 3'}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (!editingField) return;
                  updateField(editingField.field, 'placeholder', editingField.placeholder);
                  updateField(editingField.field, 'validation_regex', editingField.validation_regex);
                  updateField(editingField.field, 'min_length', editingField.min_length);
                  updateField(editingField.field, 'max_length', editingField.max_length);
                  updateField(editingField.field, 'options', editingField.options);
                  setEditingField(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#111] text-sm font-semibold text-white hover:bg-[#333] transition-colors"
              >
                Применить
              </button>
              <button onClick={() => setEditingField(null)}
                className="h-11 rounded-full border border-[#e5e5e5] px-5 text-sm font-medium text-[#555] hover:bg-[#f8f8f8] transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add field modal ─── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Новое поле — {ENTITY_LABELS[entity]}</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#aaa] hover:text-[#555]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Название (label) *</label>
                <input
                  value={addForm.label}
                  onChange={e => {
                    const label = e.target.value;
                    setAddForm(f => ({ ...f, label, field: labelToSlug(label) }));
                  }}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                  placeholder="Например: Дата рождения"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">
                  Slug (идентификатор) * <span className="normal-case font-normal text-[#bbb]">a-z, 0-9, _</span>
                </label>
                <input
                  value={addForm.field}
                  onChange={e => setAddForm(f => ({ ...f, field: e.target.value.replace(/[^a-z0-9_]/g, '') }))}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm font-mono outline-none focus:border-[#999] focus:bg-white"
                  placeholder="birth_date"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Тип поля</label>
                <select
                  value={addForm.field_type}
                  onChange={e => setAddForm(f => ({ ...f, field_type: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-2 text-sm outline-none focus:border-[#999] focus:bg-white"
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {addForm.field_type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Варианты (по одному на строке)</label>
                  <textarea
                    rows={4}
                    value={addForm.options.split('\n').filter(Boolean).join('\n')}
                    onChange={e => setAddForm(f => ({ ...f, options: e.target.value }))}
                    className="w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[#999] focus:bg-white resize-none"
                    placeholder={'Вариант 1\nВариант 2'}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-1.5">Подсказка (placeholder)</label>
                <input
                  value={addForm.placeholder}
                  onChange={e => setAddForm(f => ({ ...f, placeholder: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 text-sm outline-none focus:border-[#999] focus:bg-white"
                  placeholder="Введите значение..."
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium">Обязательное</span>
                <Toggle checked={addForm.required} onChange={v => setAddForm(f => ({ ...f, required: v }))}/>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium">Видимое</span>
                <Toggle checked={addForm.visible} onChange={v => setAddForm(f => ({ ...f, visible: v }))}/>
              </div>
              {addErr && <p className="text-sm text-[#dc2626]">{addErr}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (!addForm.label.trim() || !addForm.field.trim()) { setAddErr('Заполните название и slug'); return; }
                  const options = addForm.field_type === 'select'
                    ? JSON.stringify(addForm.options.split('\n').map(l => l.trim()).filter(Boolean))
                    : '[]';
                  addField.mutate({ ...addForm, entity, options });
                }}
                disabled={addField.isPending}
                className="flex-1 h-11 rounded-full bg-[#111] text-sm font-semibold text-white hover:bg-[#333] transition-colors disabled:opacity-40"
              >
                {addField.isPending ? 'Создаём...' : 'Создать поле'}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="h-11 rounded-full border border-[#e5e5e5] px-5 text-sm font-medium text-[#555] hover:bg-[#f8f8f8] transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
