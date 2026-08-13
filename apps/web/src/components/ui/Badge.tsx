import { cn } from '@/lib/cn';

type Variant = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray';

const VARIANTS: Record<Variant, string> = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  orange: 'bg-amber-100 text-amber-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-500',
};

export function Badge({ variant = 'gray', children, className }: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
