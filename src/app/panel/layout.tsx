import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Asil koruma middleware'de; burada ayrica session verisine erisiyoruz.
  if (!session?.user) {
    redirect("/giris");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ust bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/panel" className="text-lg font-bold text-green-700">
            Ciftlik Pro
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/panel" className="text-gray-600 hover:text-green-700">
              Panel
            </Link>
            <Link
              href="/panel/hayvanlar"
              className="text-gray-600 hover:text-green-700"
            >
              Hayvanlar
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session.user.name}{" "}
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {session.user.role}
            </span>
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Icerik */}
      <main className="p-6">{children}</main>
    </div>
  );
}
