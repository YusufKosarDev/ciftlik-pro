"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  groupByDay,
  monthGrid,
  type CalendarEvent,
  type CalendarEventKind,
  type CalendarDay,
} from "@/lib/calendar";

type UserOption = { id: string; name: string };
type AnimalOption = { id: string; name: string; tagNumber: string };

const kindStyles: Record<CalendarEventKind, string> = {
  vaccination: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  task: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  harvest: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  birth: "bg-pink-100 text-pink-800",
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-foreground";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function CalendarView({
  events,
  year,
  month,
  prev,
  next,
  monthTitleStr,
  weekdays,
  users,
  animals,
}: {
  events: CalendarEvent[];
  year: number;
  month: number;
  prev: string;
  next: string;
  monthTitleStr: string;
  weekdays: string[];
  users: UserOption[];
  animals: AnimalOption[];
}) {
  const router = useRouter();
  const t = useTranslations("Calendar");
  const tc = useTranslations("Common");

  // Filtreleme Durumu
  const [activeFilters, setActiveFilters] = useState<Set<CalendarEventKind>>(
    new Set(["vaccination", "task", "harvest", "birth"])
  );

  // Modal Durumu
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [modalType, setModalType] = useState<"task" | "vaccination">("task");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFilter = (kind: CalendarEventKind) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) {
        if (next.size > 1) next.delete(kind); // En az bir filtre aktif kalsın
      } else {
        next.add(kind);
      }
      return next;
    });
  };

  const handleDayClick = (day: CalendarDay) => {
    // Sadece gösterilen ayın hücrelerine tıklanabilsin (veya hepsi)
    const y = day.date.getFullYear();
    const m = String(day.date.getMonth() + 1).padStart(2, "0");
    const d = String(day.date.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
    setError(null);
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    let url = "";
    let payload: Record<string, unknown> = {};

    if (modalType === "task") {
      url = "/api/tasks";
      payload = {
        title: String(fd.get("title")),
        description: String(fd.get("description")),
        assignedToId: String(fd.get("assignedToId")) || null,
        status: "PENDING",
        dueDate: selectedDate,
      };
    } else {
      const animalId = String(fd.get("animalId"));
      url = `/api/animals/${animalId}/vaccinations`;
      payload = {
        name: String(fd.get("vaccineName")),
        date: selectedDate, // aşının yapılış tarihi
        nextDate: selectedDate, // sonraki aşı tarihi (takvime yansıyan gün)
        notes: String(fd.get("notes")),
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Kayıt işlemi başarısız.");
      }

      toast.success(modalType === "task" ? "Görev eklendi." : "Aşı takvimi eklendi.");
      setShowModal(false);
      router.refresh();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Bir hata oluştu.";
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = events.filter((e) => activeFilters.has(e.kind));
  const byDay = groupByDay(filteredEvents);
  const weeks = monthGrid(year, month);

  return (
    <div className="space-y-6">
      {/* Üst Kısım / Ay Seçici */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>📅</span> {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtext", { count: filteredEvents.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/panel/takvim?ay=${prev}`}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted transition shadow-sm"
          >
            {t("prevMonth")}
          </Link>
          <span className="min-w-36 text-center text-sm font-semibold text-foreground">
            {monthTitleStr}
          </span>
          <Link
            href={`/panel/takvim?ay=${next}`}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted transition shadow-sm"
          >
            {t("nextMonth")}
          </Link>
        </div>
      </div>

      {/* İnteraktif Filtre Paneli */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { key: "vaccination", label: t("vaccination"), color: "bg-yellow-400 text-yellow-950 dark:bg-yellow-500/20 dark:text-yellow-400" },
          { key: "task", label: t("task"), color: "bg-blue-400 text-blue-950 dark:bg-blue-500/20 dark:text-blue-400" },
          { key: "harvest", label: t("harvest"), color: "bg-green-400 text-green-950 dark:bg-green-500/20 dark:text-green-400" },
          { key: "birth", label: t("birth"), color: "bg-pink-400 text-pink-950 dark:bg-pink-500/20 dark:text-pink-400" },
        ].map((f) => {
          const active = activeFilters.has(f.key as CalendarEventKind);
          return (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key as CalendarEventKind)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer transition ${
                active
                  ? `${f.color} border-transparent shadow-sm scale-[1.02]`
                  : "bg-card border-border text-muted-foreground opacity-60 hover:opacity-100"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${active ? "bg-current" : "bg-muted-foreground"}`} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid Takvim */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {weekdays.map((d) => (
            <div key={d} className="px-2 py-2.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {weeks.flat().map((day) => {
            const dayEvents = byDay.get(day.key) ?? [];
            return (
              <div
                key={day.key}
                onClick={() => handleDayClick(day)}
                className={`min-h-28 border-border p-1.5 cursor-pointer hover:bg-muted/40 transition group relative ${
                  day.inMonth ? "bg-card" : "bg-muted/30 opacity-75"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  {/* Hücre Hızlı Ekle İkonu */}
                  <span className="text-[10px] text-green-600 font-bold opacity-0 group-hover:opacity-100 transition">＋ Ekle</span>
                  <div
                    className={`text-xs ${
                      day.isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-green-600 font-bold text-white shadow-sm"
                        : day.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[84px] scrollbar-thin">
                  {dayEvents.map((e, i) => (
                    <Link
                      key={i}
                      href={e.href ?? "#"}
                      title={e.label}
                      onClick={(evt) => evt.stopPropagation()} // link tıklamasını yut, takvim hücresi açılmasın
                      className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${kindStyles[e.kind]} hover:opacity-85 transition`}
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

      {/* Hızlı Ekle Modalı */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          {/* Modal Gövdesi */}
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-1.5">
                <span>➕</span> Hızlı Kayıt Ekle ({selectedDate})
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                kapat ✕
              </button>
            </div>

            {/* Form Seçimi Tabları */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setModalType("task")}
                className={`rounded-md py-1.5 text-xs font-semibold cursor-pointer transition ${
                  modalType === "task" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ✅ Görev
              </button>
              <button
                type="button"
                onClick={() => setModalType("vaccination")}
                className={`rounded-md py-1.5 text-xs font-semibold cursor-pointer transition ${
                  modalType === "vaccination" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💉 Aşı Planı
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 pt-2">
              {modalType === "task" ? (
                <>
                  <div>
                    <label htmlFor="title" className={labelClass}>
                      Görev Başlığı *
                    </label>
                    <input id="title" name="title" type="text" required className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="assignedToId" className={labelClass}>
                        Atanan Kişi
                      </label>
                      <select id="assignedToId" name="assignedToId" className={inputClass}>
                        <option value="">Atanmadı</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dueDate" className={labelClass}>
                        Son Tarih
                      </label>
                      <input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className={labelClass}>
                      Açıklama
                    </label>
                    <textarea id="description" name="description" rows={3} className={inputClass} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="animalId" className={labelClass}>
                      Hayvan Seçin *
                    </label>
                    <select id="animalId" name="animalId" required className={inputClass}>
                      <option value="">-- Hayvan Seçin --</option>
                      {animals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.tagNumber} {a.name ? `(${a.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vaccineName" className={labelClass}>
                      Aşı Adı *
                    </label>
                    <input id="vaccineName" name="vaccineName" type="text" required className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nextDate" className={labelClass}>
                        Aşı Planı Tarihi
                      </label>
                      <input
                        id="nextDate"
                        name="nextDate"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className={labelClass}>
                        Ek Notlar
                      </label>
                      <input id="notes" name="notes" type="text" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition cursor-pointer"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition cursor-pointer"
                >
                  {saving ? "Kaydediliyor..." : tc("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
