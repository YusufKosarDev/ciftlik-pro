import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Ozel 404 sayfasi.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <MapPinOff className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Aradığınız sayfa bulunamadı.</p>
      <Link href="/panel" className={buttonVariants()}>
        Panele dön
      </Link>
    </main>
  );
}
