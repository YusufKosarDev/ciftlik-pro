// Çiftlik uyarilarini (kritik stok, geciken gorev, yaklasan asi) tek yerde
// toplayan saf mantik. Hem dashboard hem de gunluk e-posta bildirimi (cron)
// ayni kurallari kullanabilir; bu yuzden veritabanindan bagimsiz, test
// edilebilir tutulmustur.

export type InventoryLike = {
  name: string;
  quantity: number;
  criticalLevel: number;
  unit: string;
};

export type TaskLike = {
  title: string;
  status: string;
  dueDate: Date | null;
};

export type VaccinationLike = {
  name: string;
  nextDate: Date | null;
  animal: { tagNumber: string; name: string | null };
};

export type AlertInput = {
  inventory: InventoryLike[];
  tasks: TaskLike[];
  vaccinations: VaccinationLike[];
};

export type Alerts = {
  criticalStock: InventoryLike[];
  overdueTasks: TaskLike[];
  upcomingVaccinations: VaccinationLike[];
  total: number;
};

// Yaklasan asi penceresi (gun).
export const VACCINATION_WINDOW_DAYS = 30;

// Verilen ham veriden uyarilari toplar. `now` disaridan verilebilir (test icin).
export function collectAlerts(
  input: AlertInput,
  now: Date = new Date(),
  windowDays: number = VACCINATION_WINDOW_DAYS
): Alerts {
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + windowDays);

  const criticalStock = input.inventory.filter(
    (i) => i.quantity <= i.criticalLevel
  );

  const overdueTasks = input.tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate !== null && new Date(t.dueDate) < now
  );

  const upcomingVaccinations = input.vaccinations.filter((v) => {
    if (!v.nextDate) return false;
    const d = new Date(v.nextDate);
    return d >= now && d <= windowEnd;
  });

  return {
    criticalStock,
    overdueTasks,
    upcomingVaccinations,
    total:
      criticalStock.length + overdueTasks.length + upcomingVaccinations.length,
  };
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

// Uyarilari basit bir HTML e-posta govdesine cevirir.
export function renderAlertsHtml(alerts: Alerts): string {
  const sections: string[] = [];

  if (alerts.criticalStock.length > 0) {
    const items = alerts.criticalStock
      .map((i) => `<li>${i.name}: <b>${i.quantity} ${i.unit}</b> (kritik: ${i.criticalLevel})</li>`)
      .join("");
    sections.push(`<h3>📦 Kritik Stok (${alerts.criticalStock.length})</h3><ul>${items}</ul>`);
  }

  if (alerts.overdueTasks.length > 0) {
    const items = alerts.overdueTasks
      .map((t) => `<li>${t.title} — son tarih: ${formatDate(t.dueDate)}</li>`)
      .join("");
    sections.push(`<h3>⏰ Geciken Görevler (${alerts.overdueTasks.length})</h3><ul>${items}</ul>`);
  }

  if (alerts.upcomingVaccinations.length > 0) {
    const items = alerts.upcomingVaccinations
      .map(
        (v) =>
          `<li>${v.animal.name ?? v.animal.tagNumber} · ${v.name} — ${formatDate(v.nextDate)}</li>`
      )
      .join("");
    sections.push(
      `<h3>💉 Yaklaşan Aşılar (${alerts.upcomingVaccinations.length})</h3><ul>${items}</ul>`
    );
  }

  return `<div style="font-family:sans-serif">
    <h2>🌾 Çiftlik Pro — Günlük Uyarılar</h2>
    ${sections.join("")}
  </div>`;
}
