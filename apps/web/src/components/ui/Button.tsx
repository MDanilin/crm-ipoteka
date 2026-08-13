import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#111] text-white hover:bg-[#333]',
  ghost:   'bg-[#f2f2f2] text-[#111] hover:bg-[#e8e8e8]',
  danger:  'bg-[#e1261c] text-white hover:bg-[#c41f16]',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
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
        'inline-flex items-center gap-2 font-semibold rounded-full transition-colors disabled:opacity-40 cursor-pointer',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </button>
  );
}
