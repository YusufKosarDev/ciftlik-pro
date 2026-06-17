import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  parseMonthParam,
  monthRange,
  monthGrid,
  groupByDay,
  shiftMonth,
  monthTitle,
  type CalendarEvent,
} from "@/lib/calendar";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const kindStyles: Record<CalendarEvent["kind"], string> = {
  vaccination: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  task: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  harvest: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  birth: "bg-pink-100 text-pink-800",
};

export default async function TakvimPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>;
}) {
  const { ay } = await searchParams;
  const { year, month } = parseMonthParam(ay);
  const { start, end } = monthRange(year, month);

  const [vaccinations, tasks, crops, births] = await Promise.all([
    prisma.vaccination.findMany({
      where: { nextDate: { gte: start, lt: end } },
      select: { id: true, name: true, nextDate: true, animal: { select: { id: true, tagNumber: true, name: true } } },
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: start, lt: end } },
      select: { id: true, title: true, dueDate: true },
    }),
    prisma.crop.findMany({
      where: { harvestDate: { gte: start, lt: end } },
      select: { id: true, name: true, harvestDate: true, field: { select: { id: true, name: true } } },
    }),
    prisma.breedingRecord.findMany({
      where: {
        expectedBirthDate: { gte: start, lt: end },
        status: { in: ["PLANNED", "PREGNANT"] },
      },
      select: { id: true, expectedBirthDate: true, animal: { select: { id: true, tagNumber: true, name: true } } },
    }),
  ]);

  const events: CalendarEvent[] = [
    ...vaccinations.map((v) => ({
      date: v.nextDate as Date,
      kind: "vaccination" as const,
      label: `💉 ${v.animal.name ?? v.animal.tagNumber} · ${v.name}`,
      href: `/panel/hayvanlar/${v.animal.id}`,
    })),
    ...tasks.map((t) => ({
      date: t.dueDate as Date,
      kind: "task" as const,
      label: `✅ ${t.title}`,
      href: `/panel/gorevler`,
    })),
    ...crops.map((c) => ({
      date: c.harvestDate as Date,
      kind: "harvest" as const,
      label: `🌾 ${c.field.name} · ${c.name}`,
      href: `/panel/tarlalar/${c.field.id}`,
    })),
    ...births.map((b) => ({
      date: b.expectedBirthDate as Date,
      kind: "birth" as const,
      label: `🐄 ${b.animal.name ?? b.animal.tagNumber} doğum`,
      href: `/panel/hayvanlar/${b.animal.id}`,
    })),
  ];

  const byDay = groupByDay(events);
  const weeks = monthGrid(year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>📅</span> Takvim
          </h1>
          <p className="text-sm text-muted-foreground">{events.length} olay · aşı, görev, hasat, doğum</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/panel/takvim?ay=${prev}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            ‹ Önceki
          </Link>
          <span className="min-w-36 text-center text-sm font-semibold text-foreground">
            {monthTitle(year, month)}
          </span>
          <Link
            href={`/panel/takvim?ay=${next}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Sonraki ›
          </Link>
        </div>
      </div>

      {/* Renk lejandi */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-yellow-300" /> Aşı</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-300" /> Görev</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-300" /> Hasat</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-pink-300" /> Doğum</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-muted text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((day) => {
            const dayEvents = byDay.get(day.key) ?? [];
            return (
              <div
                key={day.key}
                className={`min-h-24 border-b border-r border-border p-1.5 ${
                  day.inMonth ? "bg-card" : "bg-muted/60"
                }`}
              >
                <div
                  className={`mb-1 text-right text-xs ${
                    day.isToday
                      ? "mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-600 font-bold text-white"
                      : day.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((e, i) => (
                    <Link
                      key={i}
                      href={e.href ?? "#"}
                      title={e.label}
                      className={`block truncate rounded px-1 py-0.5 text-[11px] ${kindStyles[e.kind]} hover:opacity-80`}
                    >
                      {e.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
