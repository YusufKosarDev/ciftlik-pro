import { auth } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-prisma";
import { getTranslations, getLocale } from "next-intl/server";
import {
  parseMonthParam,
  monthRange,
  shiftMonth,
  type CalendarEvent,
} from "@/lib/calendar";
import { CalendarView } from "@/components/calendar-view";

const WEEKDAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function TakvimPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>;
}) {
  const { ay } = await searchParams;
  const { year, month } = parseMonthParam(ay);
  const { start, end } = monthRange(year, month);

  const session = await auth();
  const t = await getTranslations("Calendar");
  const locale = await getLocale();

  const [vaccinations, tasks, crops, births, users, animals] = await withTenant(session!.user.tenantId, (db) =>
    Promise.all([
      db.vaccination.findMany({
        where: { nextDate: { gte: start, lt: end } },
        select: { id: true, name: true, nextDate: true, animal: { select: { id: true, tagNumber: true, name: true } } },
      }),
      db.task.findMany({
        where: { dueDate: { gte: start, lt: end } },
        select: { id: true, title: true, dueDate: true },
      }),
      db.crop.findMany({
        where: { harvestDate: { gte: start, lt: end } },
        select: { id: true, name: true, harvestDate: true, field: { select: { id: true, name: true } } },
      }),
      db.breedingRecord.findMany({
        where: {
          expectedBirthDate: { gte: start, lt: end },
          status: { in: ["PLANNED", "PREGNANT"] },
        },
        select: { id: true, expectedBirthDate: true, animal: { select: { id: true, tagNumber: true, name: true } } },
      }),
      db.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.animal.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, tagNumber: true },
        orderBy: { tagNumber: "asc" },
      }),
    ])
  );

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
      label: t("birthLabel", { name: b.animal.name ?? b.animal.tagNumber }),
      href: `/panel/hayvanlar/${b.animal.id}`,
    })),
  ];

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const weekdays = locale === "tr" ? WEEKDAYS_TR : WEEKDAYS_EN;
  const monthTitleStr = new Date(year, month).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <CalendarView
      events={events}
      year={year}
      month={month}
      prev={prev}
      next={next}
      monthTitleStr={monthTitleStr}
      weekdays={weekdays}
      users={users}
      animals={animals}
    />
  );
}
