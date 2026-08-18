import { cn } from '@/lib/cn';

// Кнопки системы UzUsta Operations: графит — главное действие (создать,
// сохранить), синий акцент — только подтверждение выбора/фильтра, danger
// теперь контурный (не заливка), а не «кричит» на всю кнопку. Радиус
// нигде не превышает 6px — pill-форма (rounded-full) исчезла вместе
// с продуктовым мандарином.
type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-g90 text-white hover:bg-g80',
  accent:    'bg-ac text-white hover:bg-ac-hover',
  secondary: 'bg-white text-g90 border border-g30 hover:bg-g5',
  ghost:     'bg-transparent text-g70 hover:bg-g10',
  danger:    'bg-white text-dn border border-dn-border hover:bg-dn-bg',
};
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-[13px]',
};

export function Button({ variant = 'primary', size = 'md', children, className, ...props }: {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-2 font-medium rounded transition-colors disabled:opacity-40 cursor-pointer',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </button>
  );
}
