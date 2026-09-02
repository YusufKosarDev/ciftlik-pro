// Links that point outside the application.
//
// The source link has three consumers — the landing page, the sign-in card and
// the panel sidebar — and lives here rather than being typed three times, for the
// same reason the demo account list does: three copies of a URL drift, and a
// stale one on the sign-in screen is worse than no link at all.
//
// This module imports nothing, so client and server components can both read it.

export const GITHUB_URL = "https://github.com/YusufKosarDev/ciftlik-pro";
