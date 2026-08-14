'use client';

import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Campaign, CampaignContact } from '@crm/types';
import { Button } from '@/components/ui/Button';

// ── Status config ──────────────────────────────────────────────────────────────

const CALL_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending',        label: 'Не обработан',   color: 'bg-[#f3f4f6] text-[#555]' },
  { value: 'no_answer',      label: 'Не дозвонились', color: 'bg-[#f3f4f6] text-[#888]' },
  { value: 'not_interested', label: 'Не интересно',   color: 'bg-[#fee2e2] text-[#991b1b]' },
  { value: 'callback',       label: 'Перезвонить',    color: 'bg-[#fef3c7] text-[#92400e]' },
  { value: 'meeting',        label: 'Встреча',        color: 'bg-[#fde7d0] text-[#9a3412]' },
  { value: 'lead_created',   label: 'Лид создан',     color: 'bg-[#dcfce7] text-[#166534]' },
];

const STATUS_MAP = Object.fromEntries(CALL_STATUSES.map(s => [s.value, s]));

// ── Inline result select ───────────────────────────────────────────────────────

function ResultSelect({ contact, campaignId }: { contact: CampaignContact; campaignId: string }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(contact.result_note ?? '');
  const [open, setOpen] = useState(false);
  const cfg = STATUS_MAP[contact.call_status] ?? STATUS_MAP.pending;

  const upd = useMutation({
    mutationFn: ({ call_status, result_note }: { call_status: string; result_note?: string }) =>
      api.put(`/campaigns/${campaignId}/contacts/${contact.id}`, { call_status, result_note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', campaignId] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.color} hover:opacity-80 transition-opacity`}
      >
        {cfg.label} <span className="text-[9px] opacity-60">▼</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#f0f0f0] w-52 py-1">
          {CALL_STATUSES.filter(s => s.value !== 'pending').map(s => (
            <button
              key={s.value}
              onClick={() => {
                upd.mutate({ call_status: s.value, result_note: note || undefined });
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f9f9f9] text-left"
            >
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
            </button>
          ))}
          <div className="border-t border-[#f5f5f5] mt-1 px-3 pt-2 pb-2">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && note) { upd.mutate({ call_status: contact.call_status, result_note: note }); setOpen(false); }}}
              placeholder="Комментарий..."
              className="w-full text-xs border border-[#eee] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#aaa]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

interface CampaignDetail extends Campaign { contacts: CampaignContact[] }

export default function CampaignDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const user   = useAuthStore(s => s.user);
  const qc     = useQueryClient();

  const fileRef   = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ company: string; inn: string; contact_name: string; phone: string }[] | null>(null);
  const [importError, setImportError]     = useState('');
  const [distOpen, setDistOpen]           = useState(false);
  const [selectedOps, setSelectedOps]     = useState<string[]>([]);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterOp, setFilterOp]           = useState('all');
  const [search, setSearch]               = useState('');

  const isOperator = user?.role === 'operator';
  const canManage  = !isOperator;

  const { data: campaign, isLoading } = useQuery<CampaignDetail>({
    queryKey: ['campaign', id],
    queryFn:  () => api.get(`/campaigns/${id}`),
  });

  const importMut = useMutation({
    mutationFn: (contacts: typeof importPreview) =>
      api.post(`/campaigns/${id}/import`, { contacts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setImportPreview(null);
    },
  });

  const distMut = useMutation({
    mutationFn: (operators: string[]) =>
      api.post(`/campaigns/${id}/distribute`, { operators }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      setDistOpen(false);
      setSelectedOps([]);
    },
  });

  const patchCampaign = useMutation({
    mutationFn: (status: string) => api.patch(`/campaigns/${id}`, { status }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['campaign', id] }),
  });

  // ── Excel parse ──────────────────────────────────────────────────────────────
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        if (rows.length === 0) { setImportError('Файл пустой или формат не распознан'); return; }

        // Flexible column mapping
        const mapCol = (row: Record<string, string>, ...keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(row).find(rk => rk.toLowerCase().includes(k.toLowerCase()));
            if (found) return String(row[found] ?? '').trim();
          }
          return '';
        };

        const contacts = rows.map(row => ({
          company:      mapCol(row, 'наимен', 'компани', 'организ', 'name', 'company'),
          inn:          mapCol(row, 'инн', 'inn', 'tax'),
          contact_name: mapCol(row, 'контакт', 'лицо', 'contact', 'person', 'фио'),
          phone:        mapCol(row, 'телефон', 'phone', 'тел'),
        })).filter(r => r.company || r.inn || r.phone);

        if (contacts.length === 0) { setImportError('Не удалось распознать колонки. Проверьте заголовки.'); return; }
        setImportPreview(contacts);
      } catch {
        setImportError('Ошибка чтения файла. Убедитесь что файл в формате .xlsx или .xls');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  // ── Filtered contacts ────────────────────────────────────────────────────────
  const allContacts = campaign?.contacts ?? [];
  const contacts = isOperator
    ? allContacts.filter(c => c.assigned_to === user?.name)
    : allContacts;
  const operators = useMemo(() => {
    const s = new Set(contacts.filter(c => c.assigned_to).map(c => c.assigned_to));
    return Array.from(s).sort();
  }, [contacts]);

  const filtered = contacts.filter(c => {
    if (filterStatus !== 'all' && c.call_status !== filterStatus) return false;
    if (filterOp !== 'all' && c.assigned_to !== filterOp) return false;
    if (search && !c.company.toLowerCase().includes(search.toLowerCase()) &&
        !c.inn.includes(search) && !c.contact_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Analytics ────────────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const byStatus = CALL_STATUSES.map(s => ({
      ...s, count: contacts.filter(c => c.call_status === s.value).length,
    }));
    const byOp = operators.map(op => {
      const mine = contacts.filter(c => c.assigned_to === op);
      return {
        op, total: mine.length,
        processed: mine.filter(c => c.call_status !== 'pending').length,
        leads: mine.filter(c => c.call_status === 'lead_created').length,
        meetings: mine.filter(c => c.call_status === 'meeting').length,
      };
    });
    const converted = contacts.filter(c => c.call_status === 'lead_created' || c.call_status === 'meeting').length;
    const calledTotal = contacts.filter(c => c.call_status !== 'pending').length;
    const convRate = calledTotal > 0 ? Math.round((converted / calledTotal) * 100) : 0;
    return { byStatus, byOp, converted, calledTotal, convRate };
  }, [contacts, operators]);

  // ── Users for distribution ───────────────────────────────────────────────────
  const { data: users = [] } = useQuery<{ id: number; name: string; role: string }[]>({
    queryKey: ['users'],
    queryFn:  () => api.get('/users'),
    enabled: distOpen,
  });
  const staffUsers = users.filter(u => ['manager', 'supervisor', 'admin', 'operator'].includes(u.role));

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#aaa] text-sm">Загрузка...</div>;
  if (!campaign) return (
    <div className="py-24 text-center">
      <div className="text-2xl font-semibold mb-2">Кампания не найдена</div>
      <button onClick={() => router.push('/campaigns')} className="text-sm text-[#aaa] hover:text-[#111] mt-3">← Все кампании</button>
    </div>
  );

  const pct = campaign.total > 0 ? Math.round((campaign.processed / campaign.total) * 100) : 0;
  const dups = contacts.filter(c => c.is_duplicate).length;

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.push('/campaigns')} className="flex items-center gap-2 text-sm text-[#aaa] hover:text-[#111] mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Все кампании
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-[clamp(32px,4vw,60px)] font-semibold leading-none tracking-[-0.07em]">{campaign.name}</h1>
          <p className="mt-2 text-sm text-[#aaa]">{campaign.source} · создана {campaign.created_at?.slice(0, 10)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && allContacts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => {
              const rows = allContacts.map(c => ({
                'Компания': c.company,
                'ИНН': c.inn,
                'Контакт': c.contact_name,
                'Телефон': c.phone,
                'Оператор': c.assigned_to || '—',
                'Статус': STATUS_MAP[c.call_status]?.label ?? c.call_status,
                'Комментарий': c.result_note || '',
                'Дата звонка': c.called_at ? new Date(c.called_at).toLocaleString('ru-RU') : '',
                'Дубликат': c.is_duplicate ? 'Да' : 'Нет',
              }));
              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Контакты');
              XLSX.writeFile(wb, `${campaign.name}.xlsx`);
            }}>↓ Выгрузить Excel</Button>
          )}
          {canManage && campaign.status !== 'completed' && (
            <Button variant="ghost" size="sm" onClick={() => patchCampaign.mutate('completed')}>Завершить</Button>
          )}
          {canManage && allContacts.length === 0 && (
            <>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile}/>
              <Button size="sm" onClick={() => fileRef.current?.click()}>↑ Импорт Excel</Button>
            </>
          )}
          {canManage && allContacts.length > 0 && operators.length === 0 && (
            <Button size="sm" onClick={() => setDistOpen(true)}>Распределить</Button>
          )}
          {canManage && allContacts.length > 0 && operators.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDistOpen(true)}>Перераспределить</Button>
          )}
          {canManage && allContacts.length === 0 && (
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile}/>
          )}
        </div>
      </div>

      {/* Import button top area (when contacts exist) */}
      {contacts.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile}/>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 border-y border-[#eee] py-6 mb-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">Всего</div>
          <div className="text-4xl font-bold leading-none">{campaign.total}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">Обработано</div>
          <div className="text-4xl font-bold leading-none">{campaign.processed}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">Осталось</div>
          <div className="text-4xl font-bold leading-none text-[#aaa]">{campaign.pending}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">Конверсия</div>
          <div className="text-4xl font-bold leading-none">{analytics.convRate}%</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2">Прогресс</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#111] rounded-full transition-all" style={{ width: `${pct}%` }}/>
            </div>
            <span className="text-sm font-bold text-[#555] w-10">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Import preview modal */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="px-6 py-5 border-b border-[#f0f0f0]">
              <div className="text-lg font-semibold">Предпросмотр импорта</div>
              <div className="text-sm text-[#aaa] mt-1">
                {importPreview.length} контактов · {(() => { const knownDupInns = new Set(contacts.filter(c => c.is_duplicate).map(c => c.inn)); const existingInns = new Set(contacts.map(c => c.inn).filter(Boolean)); return importPreview.filter(c => c.inn && (knownDupInns.has(c.inn) || existingInns.has(c.inn))).length; })()} дублей по ИНН
              </div>
            </div>
            <div className="overflow-auto max-h-72 px-6 py-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.08em] text-[#999]">
                    <th className="text-left py-2">Компания</th>
                    <th className="text-left py-2">ИНН</th>
                    <th className="text-left py-2">Контакт</th>
                    <th className="text-left py-2">Телефон</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-[#f9f9f9]">
                      <td className="py-1.5 pr-3 font-medium truncate max-w-[140px]">{r.company || '—'}</td>
                      <td className="py-1.5 pr-3 text-[#555]">{r.inn || '—'}</td>
                      <td className="py-1.5 pr-3 text-[#555]">{r.contact_name || '—'}</td>
                      <td className="py-1.5 text-[#555]">{r.phone || '—'}</td>
                    </tr>
                  ))}
                  {importPreview.length > 8 && (
                    <tr><td colSpan={4} className="py-2 text-xs text-[#aaa]">...ещё {importPreview.length - 8} строк</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setImportPreview(null)}>Отмена</Button>
              <Button onClick={() => importMut.mutate(importPreview)} disabled={importMut.isPending}>
                {importMut.isPending ? 'Импортирую...' : `Импортировать ${importPreview.length} контактов`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution modal */}
      {distOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-[#f0f0f0]">
              <div className="text-lg font-semibold">Распределить контакты</div>
              <div className="text-sm text-[#aaa] mt-1">Выберите операторов для обзвона</div>
            </div>
            <div className="px-6 py-4 space-y-2">
              {staffUsers.map(u => (
                <label key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-[#fafafa] -mx-2 px-2 rounded-xl py-2">
                  <input
                    type="checkbox"
                    checked={selectedOps.includes(u.name)}
                    onChange={e => setSelectedOps(e.target.checked
                      ? [...selectedOps, u.name]
                      : selectedOps.filter(n => n !== u.name)
                    )}
                    className="rounded"
                  />
                  <div className="grid size-8 place-items-center rounded-full bg-[#f3dcd8] text-xs font-bold text-[#7c3f36] flex-shrink-0">
                    {u.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                  </div>
                  <span className="text-sm font-medium">{u.name}</span>
                </label>
              ))}
            </div>
            {selectedOps.length > 0 && (
              <div className="px-6 pb-2 text-xs text-[#aaa]">
                ~{Math.ceil(campaign.pending / selectedOps.length)} контактов на оператора
              </div>
            )}
            <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDistOpen(false)}>Отмена</Button>
              <Button onClick={() => distMut.mutate(selectedOps)} disabled={!selectedOps.length || distMut.isPending}>
                Распределить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {allContacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#e5e5e5] rounded-2xl">
          <div className="text-4xl mb-4">📂</div>
          <div className="text-base font-semibold mb-1">Контакты не загружены</div>
          <div className="text-sm text-[#aaa] mb-4">Импортируйте Excel-файл со списком клиентов</div>
          {canManage && <Button onClick={() => fileRef.current?.click()}>↑ Загрузить Excel</Button>}
          {importError && <div className="mt-3 text-sm text-[#e1261c]">{importError}</div>}
        </div>
      )}

      {/* Contacts section */}
      {contacts.length > 0 && (
        <>
          {/* Analytics row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* By status */}
            <div className="border border-[#f0f0f0] rounded-2xl p-6">
              <div className="text-base font-semibold mb-4">Результаты обзвона</div>
              <div className="space-y-2.5">
                {analytics.byStatus.filter(s => s.value !== 'pending').map(s => {
                  const pct = campaign.total > 0 ? Math.round((s.count / campaign.total) * 100) : 0;
                  return (
                    <div key={s.value} className="flex items-center gap-3">
                      <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold w-36 justify-center ${s.color}`}>{s.label}</span>
                      <div className="flex-1 h-1.5 bg-[#f3f3f3] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#111]" style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{s.count}</span>
                    </div>
                  );
                })}
              </div>
              {dups > 0 && (
                <div className="mt-4 rounded-xl bg-[#fef3c7] px-4 py-2.5 text-xs text-[#92400e]">
                  {dups} контактов имеют дубль ИНН в базе лидов
                </div>
              )}
            </div>

            {/* By operator */}
            {analytics.byOp.length > 0 && (
              <div className="border border-[#f0f0f0] rounded-2xl p-6">
                <div className="text-base font-semibold mb-4">Эффективность операторов</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-[#999]">
                      <th className="text-left pb-3">Оператор</th>
                      <th className="text-right pb-3">Всего</th>
                      <th className="text-right pb-3">Обработ.</th>
                      <th className="text-right pb-3">Встречи</th>
                      <th className="text-right pb-3">Лиды</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byOp.map(row => (
                      <tr key={row.op} className="border-t border-[#f9f9f9]">
                        <td className="py-2 font-medium text-sm">{row.op}</td>
                        <td className="py-2 text-right text-sm">{row.total}</td>
                        <td className="py-2 text-right text-sm">{row.processed}</td>
                        <td className="py-2 text-right text-sm text-[#9a3412]">{row.meetings}</td>
                        <td className="py-2 text-right text-sm font-semibold text-[#166534]">{row.leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по компании, ИНН..."
              className="h-9 rounded-full border border-[#e5e5e5] bg-[#f9f9f9] px-4 text-sm outline-none focus:border-[#aaa] w-56"
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-9 w-44 rounded-full border border-[#e5e5e5] bg-[#f9f9f9] px-4 text-sm outline-none">
              <option value="all">Все статусы</option>
              {CALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {operators.length > 0 && (
              <select value={filterOp} onChange={e => setFilterOp(e.target.value)}
                className="h-9 w-44 rounded-full border border-[#e5e5e5] bg-[#f9f9f9] px-4 text-sm outline-none">
                <option value="all">Все операторы</option>
                {operators.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            )}
            <div className="text-xs text-[#aaa]">{filtered.length} из {contacts.length}</div>
          </div>

          {/* Contacts table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-[#f6f6f6] text-xs font-bold uppercase tracking-[0.08em] text-[#999]">
                  <th className="rounded-l-xl px-4 py-3">Компания</th>
                  <th className="px-4 py-3">ИНН</th>
                  <th className="px-4 py-3">Контакт / Телефон</th>
                  <th className="px-4 py-3">Оператор</th>
                  <th className="px-4 py-3">Результат</th>
                  <th className="rounded-r-xl px-4 py-3">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-[#f5f5f5] hover:bg-[#fcf8f8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{c.company || '—'}</div>
                      {!!c.is_duplicate && <div className="text-[10px] text-[#92400e] mt-0.5">⚠ Дубль в базе</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#888] font-mono">{c.inn || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{c.contact_name || '—'}</div>
                      <div className="text-xs text-[#aaa]">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#555]">{c.assigned_to || <span className="text-[#ccc]">—</span>}</td>
                    <td className="px-4 py-3">
                      <ResultSelect contact={c} campaignId={id}/>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#888] max-w-[160px] truncate">{c.result_note || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-[#aaa]">Нет контактов по фильтру</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
