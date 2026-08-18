import { cn } from '@/lib/cn';

// Статус-пилюли системы UzUsta Operations: светлая заливка, тёмный
// текст того же оттенка, цветная точка — «Так», а не насыщенная заливка
// на всю ячейку («Не так»). Цвет = смысл: зелёный/янтарный/красный говорят
// о состоянии данных, синий — что элемент акцентный/основной. Пятого
// цвета в системе нет — variant="purple" рендерится тёмной графитовой
// пилюлей (акцент весом, а не оттенком) для меток вроде «Premium».
// Имена вариантов сохранены для обратной совместимости со всеми местами,
// где Badge уже вызывается с variant="green"/"purple"/итд — меняется
// только то, как каждый вариант рендерится, а не API.
type Variant = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray';

const VARIANTS: Record<Variant, string> = {
  green:  'bg-ok-bg text-ok border-ok-border',
  red:    'bg-dn-bg text-dn border-dn-border font-semibold',
  orange: 'bg-warn-bg text-warn border-warn-border',
  blue:   'bg-ac-bg text-ac border-ac-border',
  purple: 'bg-g90 text-white border-g90 font-semibold',
  gray:   'bg-g10 text-g70 border-g20',
};

const DOT: Record<Variant, string> = {
  green:  'bg-ok',
  red:    'bg-dn',
  orange: 'bg-warn',
  blue:   'bg-ac',
  purple: 'bg-white',
  gray:   'bg-g60',
};

export function Badge({ variant = 'gray', children, className }: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded px-2 py-0.5 border text-[11px] font-medium whitespace-nowrap',
      VARIANTS[variant], className
    )}>
      <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', DOT[variant])} />
      {children}
    </span>
  );
}
