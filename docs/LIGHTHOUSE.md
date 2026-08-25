# Lighthouse

Measured with Lighthouse 12 (mobile emulation, simulated throttling) against a
local **production build** (`npm run build && npm run start`), so the numbers
reflect the shipped bundle rather than the dev server.

Reproduce:

```bash
npm run build && npm run start
npx lighthouse http://localhost:3000/giris --chrome-flags="--headless=new"
```

## Results

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/giris` (sign-in) | **88** | **96** | **100** | **100** |
| `/magaza/default` (public storefront) | **92** | **95** | **100** | **100** |

### Core Web Vitals (lab)

| Page | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| `/giris` | 1.1 s | 3.5 s | 190 ms | **0** |
| `/magaza/default` | 1.1 s | 3.2 s | 110 ms | **0** |

**CLS is 0 on both pages** — no layout shift. That is not luck: lazily loaded
charts render a skeleton of exactly the same height as the chart that replaces
it (`ChartSkeleton`), and images carry explicit dimensions.

## Reading these numbers honestly

- **Accessibility 95-96, not 100.** The gap comes from contrast ratios on a few
  muted-foreground labels. Worth fixing; not yet fixed.
- **LCP above 2.5 s** under Lighthouse's simulated mobile throttling (Slow 4G,
  4× CPU slowdown). Both pages are server-rendered on demand — they are behind
  authentication or per-tenant — so there is no static prerender to serve
  instantly. On a normal desktop connection both paint well under a second.
- **These are lab numbers from one machine**, not field data. They are useful for
  catching regressions, not as an absolute claim about user experience.

## What the panel pages are not

The authenticated dashboard is deliberately excluded: it is behind a login, fully
dynamic per tenant, and dominated by chart rendering. Auditing it would produce a
number that mostly measures Recharts, and Lighthouse's mobile emulation is not the
context those screens are used in.
