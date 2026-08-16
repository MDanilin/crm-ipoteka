import { cn } from '@/lib/cn';

// Монохромная система статусов (Rocket Work): цветные пилюли на каждый
// статус — шум при сканировании длинных списков. Цвет остаётся только
// там, где он реально сигнализирует проблему (variant="red" — просрочка,
// потерян, ошибка). Остальное — обычный текст без заливки.
// Имена вариантов сохранены для обратной совместимости со всеми местами,
// где Badge уже вызывается с variant="green"/"purple"/итд — меняется
// только то, как каждый вариант рендерится, а не API.
type Variant = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray';

const VARIANTS: Record<Variant, string> = {
  green:  'text-[#111]',
  red:    'text-[#c41f16] font-semibold',
  orange: 'text-[#111]',
  blue:   'text-[#111]',
  purple: 'text-[#111] font-semibold',
  gray:   'text-[#999]',
};

export function Badge({ variant = 'gray', children, className }: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center text-sm whitespace-nowrap', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
