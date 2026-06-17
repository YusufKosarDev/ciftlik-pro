"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { taskStatusLabels } from "@/lib/labels";
import { toDateInputValue } from "@/lib/date";
import type { Task } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

type UserOption = { id: string; name: string };

export function TaskForm({
  task,
  users,
}: {
  task?: Task;
  users: UserOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(task);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      description: String(fd.get("description")),
      assignedToId: String(fd.get("assignedToId")),
      status: String(fd.get("status")),
      dueDate: String(fd.get("dueDate")),
    };

    const res = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Kayit basarisiz, lutfen tekrar deneyin");
      return;
    }

    toast.success("Görev kaydedildi.");
    router.push("/panel/gorevler");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div>
        <label htmlFor="title" className={labelClass}>
          Baslik *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={task?.title ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="assignedToId" className={labelClass}>
            Atanan Kisi
          </label>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={task?.assignedToId ?? ""}
            className={inputClass}
          >
            <option value="">Atanmadi</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Durum
          </label>
          <select
            id="status"
            name="status"
            defaultValue={task?.status ?? "PENDING"}
            className={inputClass}
          >
            {Object.entries(taskStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
            defaultValue={toDateInputValue(task?.dueDate)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Aciklama
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/gorevler"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Iptal
        </Link>
        <Button type="submit" loading={loading}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
