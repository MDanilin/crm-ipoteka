import type { HQAnalytics, LostAnalytics } from '@crm/types';

// xlsx loaded lazily to avoid Next.js SSR module-init errors
async function getXLSX() {
  return import('xlsx');
}

type WS = { [key: string]: unknown; '!cols'?: { wch: number }[] };

function autoWidth(XLSX: Awaited<ReturnType<typeof getXLSX>>, ws: WS) {
  const data = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws as never, { header: 1 });
  const widths: number[] = [];
  for (const row of data) {
    row.forEach((cell, i) => {
      const len = cell != null ? String(cell).length : 0;
      widths[i] = Math.max(widths[i] ?? 8, Math.min(len + 2, 40));
    });
  }
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

export async function exportHQToExcel(data: HQAnalytics, period: string) {
  const XLSX = await getXLSX();
  const periodLabel = period === '30' ? '30 дней' : period === '90' ? '90 дней' : 'Всё время';
  const wb = XLSX.utils.book_new();

  // Sheet 1: Сводка
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['Управленческий отчёт — Аналитика CRM'],
    [`Период: ${periodLabel}`],
    [],
    ['Показатель', 'Значение'],
    ['Лидов за период', data.total],
    ['Конвертировано', data.converted],
    ['Конверсия', `${data.conversion_pct}%`],
    ['Средний срок обработки (дней)', data.avg_days ?? '—'],
  ]);
  autoWidth(XLSX, wsSummary as WS);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

  // Sheet 2: Лиды по каналам
  const wsCh = XLSX.utils.aoa_to_sheet([
    ['Канал', 'Лидов', 'Конвертировано', 'Потеряно', 'Активных', 'Конверсия %', 'Ср. срок (дней)'],
    ...data.by_channel.map(c => [c.channel, c.total, c.converted, c.lost, c.active, c.conversion_pct, c.avg_days ?? '']),
  ]);
  autoWidth(XLSX, wsCh as WS);
  XLSX.utils.book_append_sheet(wb, wsCh, 'По каналам');

  // Sheet 3: Воронка
  const stageKeys = ['new', 'in_progress', 'meeting', 'account_opened', 'converted', 'lost'] as const;
  const stageLabels = ['Новый', 'В работе', 'Встреча', 'Открыт счёт', 'Конвертирован', 'Потерян'];
  const wsFunnel = XLSX.utils.aoa_to_sheet([
    ['Этап', ...data.by_channel.map(c => c.channel)],
    ...stageKeys.map((key, i) => [stageLabels[i], ...data.by_channel.map(c => c.funnel[key] || '')]),
  ]);
  autoWidth(XLSX, wsFunnel as WS);
  XLSX.utils.book_append_sheet(wb, wsFunnel, 'Воронка');

  // Sheet 4: Конверсия сотрудников
  const wsEmpConv = XLSX.utils.aoa_to_sheet([
    ['Сотрудник', 'Лидов', 'Конвертировано', 'Конверсия %', 'Ср. срок (дней)'],
    ...data.by_employee.map(e => [e.name, e.leads, e.converted, e.conversion_pct, e.avg_days ?? '']),
  ]);
  autoWidth(XLSX, wsEmpConv as WS);
  XLSX.utils.book_append_sheet(wb, wsEmpConv, 'Конверсия сотрудников');

  // Sheet 5: Производительность
  const wsEmpProd = XLSX.utils.aoa_to_sheet([
    ['Сотрудник', 'Звонки', 'Встречи', 'Задачи', 'Всего активностей'],
    ...data.by_employee.map(e => [e.name, e.calls, e.meetings, e.tasks, e.calls + e.meetings + e.tasks]),
  ]);
  autoWidth(XLSX, wsEmpProd as WS);
  XLSX.utils.book_append_sheet(wb, wsEmpProd, 'Производительность');

  XLSX.writeFile(wb, `HQ_Отчёт_${periodLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportLostToExcel(data: LostAnalytics) {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();
  const date = new Date().toISOString().slice(0, 10);

  // Sheet 1: Сводка
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['Аналитика потерь — CRM Ипотека Банк'],
    [`Дата выгрузки: ${date}`],
    [],
    ['Показатель', 'Значение'],
    ['Всего потерь', data.total],
    ['Потери за этот месяц', data.this_month],
  ]);
  autoWidth(XLSX, wsSummary as WS);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

  // Sheet 2: Причины отказов
  const wsReason = XLSX.utils.aoa_to_sheet([
    ['Причина', 'Количество', 'Доля %'],
    ...data.by_reason.map(r => [r.reason, r.count, data.total > 0 ? Math.round((r.count / data.total) * 100) : 0]),
  ]);
  autoWidth(XLSX, wsReason as WS);
  XLSX.utils.book_append_sheet(wb, wsReason, 'Причины отказов');

  // Sheet 3: По каналам
  const wsSource = XLSX.utils.aoa_to_sheet([
    ['Канал', 'Количество', 'Доля %'],
    ...data.by_source.map(s => [s.source, s.count, data.total > 0 ? Math.round((s.count / data.total) * 100) : 0]),
  ]);
  autoWidth(XLSX, wsSource as WS);
  XLSX.utils.book_append_sheet(wb, wsSource, 'По каналам');

  // Sheet 4: По сотрудникам
  const wsMgr = XLSX.utils.aoa_to_sheet([
    ['Сотрудник', 'Потерь', 'Доля %'],
    ...data.by_manager.map(m => [m.manager, m.count, data.total > 0 ? Math.round((m.count / data.total) * 100) : 0]),
  ]);
  autoWidth(XLSX, wsMgr as WS);
  XLSX.utils.book_append_sheet(wb, wsMgr, 'По сотрудникам');

  XLSX.writeFile(wb, `Аналитика_потерь_${date}.xlsx`);
}
