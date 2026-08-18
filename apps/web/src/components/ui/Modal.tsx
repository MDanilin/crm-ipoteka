'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';

export function Modal({ open, title, onClose, children, footer }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-5"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn('relative w-full max-w-[520px] rounded-[28px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto')}>
        <div className="flex items-center justify-between px-7 pt-7 pb-0">
          <h3 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-g10 p-2 hover:bg-g30 transition-colors"
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="#171c24" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-7 py-6">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-7 pb-7 pt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
