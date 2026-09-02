# Lighthouse

Measured with Lighthouse 12.8.2 (mobile emulation, simulated throttling) against
the **deployed site**, so the numbers describe what a visitor actually gets rather
than a build on one developer's machine.

Reproduce — no clone required:

```bash
npx lighthouse https://ciftlik-pro.vercel.app/ --chrome-flags="--headless=new"
```

## Results

All three pages were measured in the same session.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` (landing) | **96** | **100** | **100** | **100** |
| `/giris` (sign-in) | **100** | **100** | **100** | **100** |
| `/magaza/default` (public storefront) | **100** | **100** | **100** | **100** |

### Core Web Vitals (lab)

| Page | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| `/` | 1.4 s | 2.6 s | 30 ms | **0** |
| `/giris` | 1.1 s | 1.7 s | 10 ms | **0** |
| `/magaza/default` | 1.0 s | 1.4 s | 10 ms | **0** |

**CLS is 0 on all three pages.** That is not luck: lazily loaded charts render a
skeleton of exactly the same height as the chart that replaces it
(`ChartSkeleton`), and every image carries explicit dimensions.

## Reading these numbers honestly

- **Accessibility reached 100 by fixing colours, not by lowering the bar.** It sat
  at 95-96 for a while, and this document blamed "muted-foreground labels" — a
  guess written from the audit's title rather than its failing nodes, and wrong.
  The real failure was white text on the brand green: `green-600` (`#00a63e`)
  gives 3.22:1 where AA wants 4.5:1. The palette moved one step to `green-700`
  (`#008236`, 4.95:1). Two worse cases never showed up in these scores at all,
  because they live on the panel pages this config excludes: `text-green-600` as a
  foreground (3.22:1) and an onboarding gradient ending in `emerald-500` (2.47:1).
- **The landing page's ~68 KiB of `uses-responsive-images` savings is deliberate.**
  Its screenshots ship at a single 1280px width instead of per-viewport sizes,
  which is the cost of not using `next/image` — that component would make `sharp`
  a runtime dependency and invalidate the reachability argument in the README's
  security section. They are pre-compressed to WebP by
  `scripts/showcase-images.mjs` (24-47 KB each, three per visit).
- **These are lab numbers from one run**, not field data. They are useful for
  catching regressions, not as an absolute claim about user experience. A point or
  two of Performance and tens of milliseconds of TBT move between runs.
- **Measure the deployed site, not a local build.** A local `next build --webpack`
  reports CLS 0.031 on the landing page, because under throttling the heading
  re-wraps by one line when the web font swaps. The deployed build does not do
  that. Turbopack cannot run on every machine — Windows Smart App Control blocks
  the native SWC binary — so a local build may take the webpack path and differ
  from production. That is the reason this document points at the live URL.

## What the panel pages are not

The authenticated dashboard is deliberately excluded: it is behind a login, fully
dynamic per tenant, and dominated by chart rendering. Auditing it would produce a
number that mostly measures Recharts, and Lighthouse's mobile emulation is not the
context those screens are used in. Note the consequence, stated above: contrast
bugs on those pages do not show up in this table, and had to be found by reading
the palette rather than by running the audit.
