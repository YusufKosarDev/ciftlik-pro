# Lighthouse

Measured with Lighthouse 12 (mobile emulation, simulated throttling) against a
local **production build** (`npm run build && npm run start`), so the numbers
reflect the shipped bundle rather than the dev server.

Reproduce:

```bash
npm run build && npm run start
npx lighthouse http://localhost:3000/ --chrome-flags="--headless=new"
```

## Results

All three pages were measured in the same session on Lighthouse 12.8.2, so they
are comparable with each other.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` (landing) | **91** | **96** | **100** | **100** |
| `/giris` (sign-in) | **88** | **96** | **100** | **100** |
| `/magaza/default` (public storefront) | **91** | **95** | **100** | **100** |

### Core Web Vitals (lab)

| Page | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| `/` | 1.1 s | 3.5 s | 40 ms | **0** |
| `/giris` | 1.1 s | 3.7 s | 80 ms | **0** |
| `/magaza/default` | 1.1 s | 3.5 s | 60 ms | **0** |

**CLS is 0 on all three pages** — no layout shift. That is not luck: lazily loaded
charts render a skeleton of exactly the same height as the chart that replaces
it (`ChartSkeleton`), and images carry explicit dimensions.

## Reading these numbers honestly

- **Accessibility 95-96, not 100.** On every page the only failing audit is
  `color-contrast`, from a few muted-foreground labels. Worth fixing; not yet
  fixed.
- **The landing page leaves ~68 KiB on the table** (`uses-responsive-images`). Its
  screenshots are served at a single 1280px width rather than in per-viewport
  sizes, which is the cost of not using `next/image` — that component would make
  `sharp` a runtime dependency and invalidate the reachability argument in the
  README's security section. The images are pre-compressed to WebP by
  `scripts/showcase-images.mjs` (24-47 KB each, 3 loaded per visit), and the trade
  was taken knowingly.
- **LCP above 2.5 s** under Lighthouse's simulated mobile throttling (Slow 4G,
  4× CPU slowdown). All three pages are server-rendered on demand — they read the
  locale cookie, or are behind authentication, or are per-tenant — so there is no
  static prerender to serve instantly. On a normal desktop connection they paint
  well under a second.
- **These are lab numbers from one machine**, not field data. They are useful for
  catching regressions, not as an absolute claim about user experience. Run-to-run
  movement of a point or two on Performance, and tens of milliseconds on TBT, is
  noise rather than signal.

## What the panel pages are not

The authenticated dashboard is deliberately excluded: it is behind a login, fully
dynamic per tenant, and dominated by chart rendering. Auditing it would produce a
number that mostly measures Recharts, and Lighthouse's mobile emulation is not the
context those screens are used in.
