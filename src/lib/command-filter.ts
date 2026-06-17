// Komut paleti (Cmd/Ctrl+K) icin saf filtreleme mantigi. UI'dan ayri tutulur ki
// test edilebilsin. Etiket + anahtar kelimeler uzerinde Turkce-duyarli, kucuk
// harfe indirgenmis alt-dize eslemesi yapar.

export type Command = {
  id: string;
  label: string;
  group: string; // Orn. "Git", "Oluştur"
  href: string;
  keywords?: string; // Aramayi kolaylastiran ek kelimeler
};

// Generic: cagiranin tipini (orn. ikon iceren CommandItem) korur.
// Arama kutusu icin invariant toLowerCase kullaniriz (ASCII buyuk harf yazimi da
// eslessin; Turkce locale "I"->"ı" surprizi olmasin).
export function filterCommands<T extends Command>(commands: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) =>
    `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q)
  );
}
