import { z } from "zod";
import { optionalDateString } from "@/lib/validations/date";

export const taskStatuses = ["PENDING", "IN_PROGRESS", "DONE"] as const;

// Gorev dogrulama semasi.
export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Gorev basligi zorunludur")
    .max(120, "Baslik en fazla 120 karakter olabilir"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  assignedToId: z.string().trim().optional().or(z.literal("")),
  status: z.enum(taskStatuses).default("PENDING"),
  dueDate: optionalDateString(),
});

export type TaskInput = z.infer<typeof taskSchema>;
