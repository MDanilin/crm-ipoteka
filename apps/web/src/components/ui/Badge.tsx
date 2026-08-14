import { cn } from '@/lib/cn';

type Variant = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray';

const VARIANTS: Record<Variant, string> = {
  green:  'bg-[#dcfce7] text-[#166534]',
  red:    'bg-[#fee2e2] text-[#991b1b]',
  orange: 'bg-[#fef3c7] text-[#92400e]',
  blue:   'bg-[#dbeafe] text-[#1d4ed8]',
  purple: 'bg-[#ede9fe] text-[#6d28d9]',
  gray:   'bg-[#f3f4f6] text-[#555555]',
};

export function Badge({ variant = 'gray', children, className }: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
