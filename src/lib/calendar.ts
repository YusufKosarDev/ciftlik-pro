// Pure, testable logic for the calendar view: resolving the month parameter, the
// month range, shifting months, building the 6x7 grid and grouping events by day.
// (Independent of the database and of React.)

export type CalendarEventKind = "vaccination" | "task" | "harvest" | "birth";

export type CalendarEvent = {
  date: Date;
  kind: CalendarEventKind;
  label: string;
  href?: string;
};

export type CalendarDay = {
  date: Date;
  key: string; // "YYYY-MM-DD" (yerel)
  inMonth: boolean; // gosterilen aya mi ait
  isToday: boolean;
};

// A YYYY-MM-DD key in local time.
export function dayKey(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "YYYY-MM" -> { year, month (0-based) }. Falls back to the current month.
export function parseMonthParam(
  param: string | undefined,
  now: Date = new Date()
): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec((param ?? "").trim());
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month >= 0 && month <= 11) return { year, month };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

// "YYYY-MM" format.
export function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// The [start, end) month range, for querying.
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  };
}

// Shifts by delta months (negative or positive) and returns a normalised "YYYY-MM".
export function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month + delta, 1);
  return monthParam(d.getFullYear(), d.getMonth());
}

// NOTE: the month heading is NOT produced here. The calendar page formats it with
// Intl in the active locale (src/app/panel/takvim/page.tsx); keeping a hard-coded
// Turkish month array here would silently leak Turkish text after a language
// change.

// A Monday-first 6x7 grid (always 42 days).
export function monthGrid(
  year: number,
  month: number,
  now: Date = new Date()
): CalendarDay[][] {
  const first = new Date(year, month, 1);
  // Offset so that Monday is 0 (getDay: 0=Sunday .. 6=Saturday)
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayKey = dayKey(now);

  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      const key = dayKey(date);
      week.push({
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

// Groups events by their day key.
export function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = dayKey(new Date(e.date));
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  return map;
}
