import { startOfWeek, addWeeks, format, parseISO, isAfter } from 'date-fns';

export function getProjectWeeks(startDate: string, endDate: string): string[] {
  const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
  const end = parseISO(endDate);
  const weeks: string[] = [];
  let current = start;
  while (!isAfter(current, end)) {
    weeks.push(format(current, 'yyyy-MM-dd'));
    current = addWeeks(current, 1);
  }
  return weeks;
}

export function formatWeekLabel(weekCommencing: string): string {
  return format(parseISO(weekCommencing), 'dd MMM');
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${format(parseISO(startDate), 'dd MMM yyyy')} – ${format(parseISO(endDate), 'dd MMM yyyy')}`;
}

export function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function groupWeeksByMonth(weeks: string[]): { key: string; label: string; weeks: string[] }[] {
  const groups = new Map<string, string[]>();
  weeks.forEach(w => {
    const key = format(parseISO(w), "MMM ''yy");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  });
  return [...groups.entries()].map(([key, ws]) => ({ key, label: key, weeks: ws }));
}
