// Takvim gorunumu icin saf, test edilebilir mantik: ay parametresi cozumleme,
// ay araligi, ay kaydirma, 6x7 grid uretimi ve olaylari gune gruplama.
// (Veritabanindan ve React'tan bagimsiz.)

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

// Yerel saatle YYYY-MM-DD anahtari.
export function dayKey(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "YYYY-MM" -> { year, month(0-based) }. Gecersizse icinde bulunulan ay.
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

// "YYYY-MM" bicimi.
export function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// Sorgu icin [start, end) ay araligi.
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  };
}

// delta ay kaydirir (negatif/pozitif) ve normalize "YYYY-MM" doner.
export function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month + delta, 1);
  return monthParam(d.getFullYear(), d.getMonth());
}

// Turkce ay adi.
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
export function monthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

// Pazartesi baslangicli 6x7 grid (her zaman 42 gun).
export function monthGrid(
  year: number,
  month: number,
  now: Date = new Date()
): CalendarDay[][] {
  const first = new Date(year, month, 1);
  // Pazartesi=0 olacak sekilde offset (getDay: 0=Pazar..6=Cumartesi)
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

// Olaylari gun anahtarina gore gruplar.
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
