"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Panel segmenti icin hata siniri (error boundary).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Bir şeyler ters gitti</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bu sayfa yüklenirken beklenmeyen bir hata oluştu.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCw className="h-4 w-4" />
        Tekrar dene
      </Button>
    </div>
  );
}
