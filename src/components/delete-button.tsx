"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

// Tum modullerde ortak silme dugmesi: erisilebilir onay dialog'u + toast.
export function DeleteButton({
  endpoint,
  itemLabel,
  kind,
}: {
  endpoint: string;
  itemLabel: string;
  kind?: string;
}) {
  const router = useRouter();
  const t = useTranslations("Delete");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const kindLabel = kind ?? t("defaultKind");

  async function handleConfirm() {
    setLoading(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? t("failed"));
      return;
    }

    toast.success(t("deleted", { item: itemLabel }));
    setOpen(false);
    router.refresh();
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <button className="inline-flex items-center gap-1 text-sm font-medium text-red-600 transition hover:underline">
          <Trash2 className="h-3.5 w-3.5" />
          {t("trigger")}
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <AlertDialog.Title className="text-lg font-bold text-foreground">
            {t("confirmTitle", { kind: kindLabel })}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{itemLabel}</span>{" "}
            {t("confirmBody")}
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" size="sm" disabled={loading}>
                {t("cancel")}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              <Trash2 className="h-4 w-4" />
              {t("confirm")}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
