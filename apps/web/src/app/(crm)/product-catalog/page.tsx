'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

interface CatalogItem {
  id: number;
  name: string;
  category: string;
  description: string;
  is_active: number;
  sort_order: number;
}

const CATEGORIES = ['Кредитование', 'Гарантии', 'Расчёты', 'Финансирование', 'Пассивы', 'Недвижимость', 'Прочее'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-g60 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full h-11 rounded-xl bg-g10 px-4 text-sm outline-none placeholder:text-g40 focus:bg-g10 transition-colors" />;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-g60 hover:text-g80">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProductCatalogPage() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();
  const [modal, setModal] = useState<'add' | { item: CatalogItem } | null>(null);
  const [filter, setFilter] = useState('');

  const { data: items = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['product-catalog'],
    queryFn:  () => api.get('/product-catalog'),
  });

  const addMut = useMutation({
    mutationFn: (d: Partial<CatalogItem>) => api.post('/product-catalog', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-catalog'] }); setModal(null); },
  });

  const editMut = useMutation({
    mutationFn: ({ id, ...d }: Partial<CatalogItem> & { id: number }) => api.put(`/product-catalog/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-catalog'] }); setModal(null); },
  });

  const delMut = useMutation({
    mutationFn: (id: number) => api.delete(`/product-catalog/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-catalog'] }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: number }) => api.put(`/product-catalog/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-catalog'] }),
  });

  if (user?.role !== 'admin') {
    return <div className="py-20 text-center text-gray-400">Доступ только для администраторов</div>;
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(filter.toLowerCase()) ||
    i.category.toLowerCase().includes(filter.toLowerCase())
  );

  const byCategory = filtered.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    const cat = item.category || 'Прочее';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div>
      {modal === 'add' && <ItemModal title="Добавить продукт" onClose={() => setModal(null)} onSave={d => addMut.mutate(d)} pending={addMut.isPending} />}
      {modal && typeof modal === 'object' && (
        <ItemModal title="Редактировать продукт" initial={modal.item} onClose={() => setModal(null)}
          onSave={d => editMut.mutate({ id: modal.item.id, ...d })} pending={editMut.isPending} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[clamp(42px,5vw,72px)] font-semibold leading-none tracking-[-0.08em]">Каталог продуктов</h1>
          <p className="mt-4 text-base text-g60">Список банковских продуктов, доступных для добавления клиентам</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-g90 text-white text-sm font-medium hover:bg-g80 transition-colors">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Добавить продукт
        </button>
      </div>

      <div className="mb-5">
        <input
          placeholder="Поиск по названию или категории..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full max-w-sm h-11 rounded-xl bg-g10 px-4 text-sm outline-none placeholder:text-g40"
        />
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">Нет продуктов</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-g60 mb-2 px-1">{cat}</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {catItems.map((item, idx) => (
                  <div key={item.id} className={cn('flex items-center gap-4 px-5 py-4 group', idx < catItems.length - 1 && 'border-b border-gray-100')}>
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', item.is_active ? 'bg-green-500' : 'bg-gray-300')} title={item.is_active ? 'Активен' : 'Неактивен'} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</div>}
                    </div>
                    <div className="text-xs text-gray-400 hidden sm:block">{item.category}</div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleMut.mutate({ id: item.id, is_active: item.is_active ? 0 : 1 })}
                        className="text-xs px-3 h-7 rounded-lg border border-g30 text-g80 hover:border-g60 transition-colors"
                      >
                        {item.is_active ? 'Скрыть' : 'Показать'}
                      </button>
                      <button onClick={() => setModal({ item })} className="text-xs px-3 h-7 rounded-lg border border-g30 text-g80 hover:border-g60 transition-colors">
                        Изменить
                      </button>
                      <button
                        onClick={() => { if (confirm(`Удалить "${item.name}"?`)) delMut.mutate(item.id); }}
                        className="text-xs px-3 h-7 rounded-lg border border-g30 text-red-500 hover:border-red-300 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">Всего продуктов: {items.length} · Активных: {items.filter(i => i.is_active).length}</div>
    </div>
  );
}

function ItemModal({
  title, initial, onClose, onSave, pending
}: {
  title: string;
  initial?: CatalogItem;
  onClose: () => void;
  onSave: (d: Partial<CatalogItem>) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    name:        initial?.name ?? '',
    category:    initial?.category ?? '',
    description: initial?.description ?? '',
    sort_order:  String(initial?.sort_order ?? 0),
  });
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Название *"><Input placeholder="Кредитная линия" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Категория">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full h-10 rounded-xl bg-g10 px-4 text-sm outline-none appearance-none cursor-pointer">
            <option value="">— Выберите категорию —</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Описание">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Краткое описание продукта..." rows={2}
            className="w-full rounded-xl bg-g10 px-4 py-2.5 text-sm outline-none placeholder:text-g40 focus:bg-g10 resize-none" />
        </Field>
        <Field label="Порядок сортировки"><Input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} /></Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 h-11 rounded-full border border-g30 text-sm font-medium text-g80 hover:bg-g5 transition-colors">Отмена</button>
          <button disabled={pending}
            onClick={() => { if (!form.name.trim()) { setError('Введите название'); return; } onSave({ ...form, sort_order: Number(form.sort_order) as unknown as number }); }}
            className="flex-1 h-11 rounded-full bg-g90 text-white text-sm font-medium hover:bg-g80 disabled:opacity-40 transition-colors">
            {pending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
