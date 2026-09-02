// Pure filtering logic for the command palette (Cmd/Ctrl+K). Kept apart from the
// UI so it can be tested. It does a lower-cased substring match over the label and
// the keywords.

export type Command = {
  id: string;
  label: string;
  group: string; // Orn. "Git", "Oluştur"
  href: string;
  keywords?: string; // Aramayi kolaylastiran ek kelimeler
};

// Generic, so the caller's type (a CommandItem carrying an icon, say) is
// preserved. The search box uses an invariant toLowerCase, so ASCII capitals still
// match and the Turkish locale's "I" -> "ı" surprise cannot bite.
export function filterCommands<T extends Command>(commands: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) =>
    `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q)
  );
}
