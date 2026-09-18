# Accreditation (NexAccred) — AGENTS.md

> Klasifikasi: `nexora` — approval lebih ketat untuk push/merge/deploy.

## Stack
- Prototipe: `nexaccred-app.html` single-file (~45 screen, 6 role), tanpa build.
- Review offline: `NexAccred-UIUX-Review.html`.
- Frontend: `nexaccred-react/` — React 18 · Vite · Tailwind. `npm run dev` (:5173).
- Backend: `nexaccred-api/` — NestJS + Prisma + PostgreSQL (:3001, DB `127.0.0.1:5433`).
- Docs sumber kebenaran: `00-README-Document-Index.md`, `01-PRD`, `02-ERD`,
  `03-Data-Model`, `04-Business-Process`, `05-RBAC-Separation-of-Duties`.

## Cara running lokal (AI-Workspace)
```bash
# Tahap 1 — prototipe tanpa install:
python3 -m http.server 4173
# buka http://127.0.0.1:4173/nexaccred-app.html

# Tahap 2 — React dev (butuh npm install sekali):
cd nexaccred-react && npm install
npm run dev -- --port 5173 --strictPort
# buka http://localhost:5173 (VITE_API_BASE_URL=http://localhost:3001)

# Tahap 3 — Full stack (JALAN di mesin ini sejak 2026-09-18):
# Postgres 16 lokal ~/.nexaccred-pg (port 5433, role/db nexaccred, trust local)
#   pg_ctl -D ~/.nexaccred-pg/data -o "-p 5433" -l ~/.nexaccred-pg/server.log start
# API: cd nexaccred-api && npm install && npx prisma migrate deploy &&
#   npm run prisma:seed && npm run start:dev   # :3001
# Smoke TDD: node nexaccred-api/test/api-smoke.mjs  (harus GREEN sebelum klaim "API up")
# Login demo: joan.marsh@nexaccred.io / NexAccred123! (6 user, lihat nexaccred-api/README)
```

## Aturan kerja di repo ini
1. Readiness tidak pernah di-store — dihitung ulang (`lib/readiness.js`, backend: `domain/readiness`).
2. Role filtering di frontend hanya UI-layer; enforcement sungguhan di API guard.
   Jangan klaim production-ready sebelum RBAC server-side + persistensi config.
3. Jangan commit: `node_modules/`, `dist*/`, `.env` (API berisi kredensial demo),
   `test-results/`, `*.tsbuildinfo`, `.DS_Store` (sudah di `.gitignore` masing-masing).
4. Branch kerja terisolasi, push hanya ke `dev`/`staging`, tidak pernah ke `main/master/production/prod`.
5. Jangan duplikasi system-of-record: operasi = Platform Audit, personel = AIHCM.

## Struktur
```
nexaccred-app.html / NexAccred-UIUX-Review.html  # prototipe & review
nexaccred-react/   # React+Vite app (src/, tests/*.spec.js)
nexaccred-api/     # NestJS API (src/domain|application|infrastructure|interface|modules)
00..05-*.md, *.mermaid, *.pptx                   # paket dokumen v1.0
.claude/launch.json                              # config dev :5173 + api :3001
```
