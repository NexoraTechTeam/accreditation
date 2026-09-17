# NexAccred — React Implementation

React port of the NexAccred prototype, structured as a real codebase rather than a single
file: reusable components, a separated data layer, and the readiness engine isolated as
pure functions.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the build
```

Requires Node 18+. Stack: React 18 · Vite · Tailwind CSS.

> Note: the built app uses ES modules, so it must be served over HTTP — opening
> `dist/index.html` directly via `file://` will be blocked by CORS. Use `npm run preview`.

---

## Offline UI/UX review build

```bash
npm run build:standalone   # → dist-standalone/index.standalone.html
```

A single self-contained `.html` file (JS + CSS inlined via `vite-plugin-singlefile`)
for handing to reviewers who have no backend and shouldn't need one — opens directly
via double-click, works fully offline, no `npm install` on their end.

Entry point is `src/AppStandalone.jsx` + `src/screens/LoginStandalone.jsx` — **not**
the real app (`src/App.jsx`, which authenticates against `nexaccred-api` for real).
The standalone build uses local sample data and local role selection instead, but
renders the exact same screen components via the shared `src/screenRegistry.jsx`
(so it can't visually drift from the real app), and mirrors one real RBAC behavior
worth reviewing: the readiness strip is hidden entirely for the two roles
(Impartiality Committee, System Administrator) that hold `NoAccess` on the
Requirements domain — see `AppStandalone.jsx`'s file comment.

---

## Project structure

```
src/
├── main.jsx                    entry point
├── App.jsx                     state, routing, screen registry
├── styles.css                  Tailwind layers + Knowledge Thread motif
│
├── data/
│   ├── schemes.js              accreditation bodies, schemes, witness cycles, ev() helper
│   ├── records.js              standards, requirements, compliance, personnel, tasks, roles…
│   └── roles.js                6 role definitions + navigation config
│
├── lib/
│   ├── readiness.js            ★ the readiness engine (pure functions)
│   └── format.js               dates, initials, derived task status
│
├── components/
│   ├── ui.jsx                  Badge, Card, DataTable, StatRow, GapList, PageHead, forms…
│   ├── layout.jsx              Sidebar, TopBar, ReadinessStrip
│   ├── ReadinessGauge.jsx      ★ the signature arc instrument
│   ├── SchemeCard.jsx          scheme card (handles the draft state)
│   └── icons.jsx               nav icon set
│
└── screens/
    ├── Login.jsx               role picker
    ├── Dashboards.jsx          all 6 role-specific dashboards
    ├── Accreditation.jsx       scope, scheme detail, AB list/detail, schemes table
    ├── ReadinessScreens.jsx    readiness, methodology, tasks, AB assessment + witness
    └── Screens.jsx             operations, config forms, AI screens, generic tables
```

---

## Where the important logic lives

### `lib/readiness.js` — the engine

Pure functions, no React, trivially unit-testable. Two steps, deliberately ordered:

1. **Weighted raw score** across 8 pillars → raw band
2. **Blocking rules** cap that band *downward only*

Step 2 is the product's whole thesis. A weighted average alone would let a 90%-scoring
scheme read "Ready" while a critical impartiality gap sits open. Averages hide outliers;
blocking rules refuse to.

```js
computeReadiness(schemeKey, schemes, weights, thresholds)
// → { score, band, rawScore, rawBand, reasons[] }
```

`reasons[]` is what lets every screen explain *why* a band differs from its raw score,
instead of presenting an unexplained colour.

**Readiness is never stored.** There is no `scheme.score` field — it's recomputed via
`useMemo` on every relevant state change. A stored score goes stale silently; a computed
one cannot.

### `App.jsx` — state and routing

Deliberately uses plain `useState` + a switch-based screen registry rather than Redux or
React Router. At this size that's an honest trade: less indirection, easy to follow, and
the seams are obvious when you swap in a real router and server state (TanStack Query or
similar). `ctx` is passed explicitly rather than through Context — it makes each screen's
data dependencies visible in its signature.

### `data/roles.js` — role-based UX

Each role has a `routes` allowlist driving nav filtering, plus its own dashboard route.
The `admin` role is the one to read closely: its route list contains **no business
domain** — deciding what a clause requires is a conformity-assessment judgement owned by
the Head of Accreditation, not by IT.

---

## Design system

Tokens live in `tailwind.config.js`. Colour conventions carried from the Nexora KMS
design system:

| Token | Use |
|---|---|
| `brand-700` (#2563EB) | primary actions, links, active nav |
| `ai-700` (#7C3AED) | **reserved for AI-generated and externally-sourced content** |
| `status-green/yellow/orange/red` | the four readiness bands, used nowhere else |

The violet reservation is the important one: a user should always be able to tell at a
glance whether they're looking at system-of-record data or something AI produced.

---

## Known limitations

Stated plainly so they aren't mistaken for finished capability:

| Limitation | Note |
|---|---|
| **Role filtering is UI-only** | No server-side enforcement. Must be built before production — see `05-RBAC-Separation-of-Duties.md` §5 |
| **State is in-memory** | Added schemes/requirements/weights persist for the session only; needs a backend |
| **Platform Audit data is sample data** | Integration contract not yet defined |
| **JavaScript, not TypeScript** | PRD targets TS; the data shapes in `data/` are the natural place to start adding types |
| **No tests** | `lib/readiness.js` is pure and is the obvious first target |
| **Pillar scores are seeded** | The calculation *on top of them* is fully live; pillar aggregation from evidence/findings is still to be built |

---

## Related documents

- `01-PRD-NexAccred.md` — requirements this implements
- `03-Data-Model-NexAccred.md` — the schema behind `src/data/`
- `05-RBAC-Separation-of-Duties.md` — the permission model behind `src/data/roles.js`
