"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("Common");
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/giris" })}
    >
      <LogOut className="h-4 w-4" />
      {t("logout")}
    </Button>
  );
}
