# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `app/`:

```bash
npm run dev          # start Next.js dev server on :3000
npm run build        # production build
npm run lint         # ESLint via next lint
npm run type-check   # tsc --noEmit (no test suite exists yet)
```

## Environment

Copy `app/.env.example` to `app/.env.local` before running locally. Two keys required:

- `EPC_API_TOKEN` — Bearer token from get-energy-performance-data.communities.gov.uk
- `GOOGLE_MAPS_API_KEY` — billing-enabled Google Cloud key with Solar API enabled

Land Registry needs no auth (public SPARQL endpoint).

**Test property for local dev:**
```
?uprn=100070452491&lat=52.4341337&lng=-1.9717089&address=65+Milcote+Road&postcode=B29+5NJ
```
This property has verified records in all three APIs (EPC Band D, Google Solar HIGH quality, LR sold Nov 2025).

## Architecture

### Request flow

`optimizely.js` runs on theecexperts.co.uk's thank-you page. It polls the GTM `dataLayer` for UPRN, lat/lng, address, postcode, and energy bill, then replaces the page body with a full-viewport `<iframe>` pointing at the deployed Next.js app URL with those values as query params.

The Next.js app is a **single server-rendered page** (`src/app/page.tsx`). On each request it reads query params, calls all three APIs in parallel via `Promise.allSettled`, runs `derive()` to compute all economics, then renders whichever cards have data. Individual API failures are non-blocking — the page renders with whatever succeeded and shows inline error notices.

### Data pipeline

```
page.tsx (RSC)
  ├── fetchEpc(uprn, token)           → EpcData | null
  ├── fetchSolar(lat, lng, key)       → SolarData | null
  ├── fetchLandRegistry(paon, street, postcode) → LandRegistryData | null
  └── derive(epc, solar, lr)         → DerivedData | null
        └── calcSolarEconomics() for every panel config from Solar API
```

`lib/calculations.ts` is pure (no I/O). All financial constants live there as named module-level consts (electricity rate, SEG rate, install cost/kWp, ASHP COP, etc.) — change them there, nowhere else.

### API proxy routes

`src/app/api/solar/route.ts` and `src/app/api/epc/route.ts` are thin GET proxies that forward to external APIs using server-side env vars. They exist to keep API keys out of the browser. The Land Registry route proxies the public SPARQL endpoint (no secret needed).

### Types

All shared types live in `src/types/eco-audit.ts`. `AuditParams` = what arrives via URL. `EpcData`, `SolarData`, `LandRegistryData` = raw API shapes. `DerivedData` = everything computed by `derive()`. Components only receive typed props — no raw fetch calls inside components.

### Embedding / iframe

`next.config.ts` sets `X-Frame-Options: ALLOWALL` and `frame-ancestors *` so the app can be embedded in any MVF partner domain.

## Key files

| File | Purpose |
|---|---|
| `optimizely.js` | Deployed to Optimizely; polls dataLayer, injects iframe on TYP |
| `app/src/app/page.tsx` | Single RSC page: reads params, fetches APIs, renders cards |
| `app/src/lib/calculations.ts` | All financial/energy maths; no side effects |
| `app/src/types/eco-audit.ts` | Canonical type definitions for all data shapes |
| `data-model.md` | Full field reference with real API values from test property |

## optimizely.js TODOs before deployment

- Update `CONFIG.typUrl` to the deployed Vercel URL
- Replace `QUESTIONS.homeowner.id` and `QUESTIONS.propertyType.id` with real Sugar question IDs from the form owner
