"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GirisPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-posta veya parola hatali");
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  // Ziyaretciler icin: kayit gerektirmeyen demo (WORKER) hesabiyla giris.
  async function handleDemo() {
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email: "demo@ciftlik.com",
      password: "demo1234",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Demo girisi su an kullanilamiyor");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
            🌾
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ciftlik Pro</h1>
          <p className="mt-1 text-sm text-gray-500">Hesabiniza giris yapin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Parola
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Giris yapiliyor..." : "Giris Yap"}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-gray-400">veya</div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="w-full rounded-lg border border-green-600 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
        >
          🌱 Demo olarak gez
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Kayit gerektirmez · ornek verilerle inceleyin
        </p>
      </div>
    </main>
  );
}
