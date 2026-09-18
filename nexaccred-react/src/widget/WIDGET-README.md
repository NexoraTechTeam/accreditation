# Readiness Widget v0.1.0 — embeddable Requirement Readiness AI Assistant (Phase 1)

Eksperimen: `~/AI-Workspace/docs/widget-readiness-ai-assistant.md`. Pilot: NEXACCRED.

## Yang diimplementasikan (Phase 1: Widget + Contextual Feedback)
- Floating widget (Ask / Findings / Session) di `App.jsx` (live) dan
  `AppStandalone.jsx` (review build offline) — konteks host (project, env,
  versi prototipe, route/screen, reviewer) direbuild tiap render.
- Q&A source-grounded (`knowledge.js`): menjawab HANYA dari PRD / Data Model /
  RBAC / Business Process / runtime. Tanpa source → `CLARIFICATION_NEEDED` +
  arahan catat finding. Tidak pernah mengarang, approve, atau menyalahkan.
- Structured findings + triage manusia (`decideFinding`), sign-off eksplisit
  per versi (`PENDING/APPROVED/APPROVED_WITH_EXCEPTIONS/REJECTED`), export JSON.
- Evidence di `localStorage` (`nexreadiness:<project>:`): session, messages,
  findings (`F-001…`), events, signoff. Audit = stored events + human decisions.
- API framework-agnostic: `window.NexReadiness` (`createStore`,
  `answerQuestion`, `buildContext`) — siap dipakai host non-React / script-tag.

## File
```
src/widget/
  version.js         PROJECT_ID=nexaccred, PROTOTYPE_VERSION=1.0.0-pilot.1
  store.js           vanilla evidence store (tanpa React)
  knowledge.js       answer engine (tanpa dependensi — bisa unit-test via node)
  contextAdapter.js  kontrak konteks host minimum
  ReadinessWidget.jsx  UI React
  index.js           public API + window.NexReadiness
```

## Coba lokal
1. `npm run dev` → http://localhost:5173 → login role mana pun → tombol **✦ AI Review** kanan bawah.
2. Tab Ask: tanya "bagaimana readiness dihitung?" (terjawab + sumber) vs "apakah cuaca cerah?" (ditolak jadi finding).
3. Catat finding → tab Findings → triage manusia → tab Session → sign-off + export JSON.
4. `npm run build:standalone` → review build offline satu file sudah termasuk widget.

## Paritas referensi (`nexaccred_requirement_readiness_prototype/rr-widget.js`)
- Tab Ask / Findings / **Readiness** (dulu Session), quick prompts
  (Guide / Validate / Edge case / Check readiness).
- Checklist 9 area + coverage % — gate = 100% & 0 open blocker;
  sign-off **ditolak** selama gate unpassed (bukan sekadar warning).
- Flag `blocking` per finding; pasca-baseline, finding baru default
  `CHANGE_REQUEST` (bukan silent scope change).
- API kompatibel: `window.RequirementReadiness.open/ask/setContext/reset`
  + hook `window.updatePrototypeStatus(snapshot, gate).
- Perbedaan sadar: triase finding open→accepted/rejected/superseded
  (referensi: OPEN→RESOLVED), severity blockers, knowledge ter grounding
   ke paket v1.0 asli (referensi mensimulasikan jawaban 87%).

## Batasan sadar (sesuai dok eksperimen)

- Knowledge masih rule-based lokal (Phase 4: retrieval + AI provider sungguhan).
- Belum ada backend: multi-reviewer / dashboard / versioning server-side = Phase 2–5.
- Naikkan `PROTOTYPE_VERSION` tiap prototipe berubah agar findings lama tidak tertukar.
