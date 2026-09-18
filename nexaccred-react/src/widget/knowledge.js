/**
 * Readiness Widget — source-grounded answer engine (dependency-free).
 *
 * Guardrails (docs/widget-readiness-ai-assistant.md §5 + PRD FR-10):
 * - Answer ONLY from the approved sources below. No approved source →
 *   classification CLARIFICATION_NEEDED + suggestion to record a finding.
 * - NEVER present assumption/suggestion as approved requirement.
 * - NEVER approve, NEVER assign blame, NEVER make compliance decisions.
 * - Bilingual (ID/EN). Best-match wins: the rule with the most keyword
 *   hits answers, so specific questions beat generic ones.
 *
 * Sources = NEXACCRED v1.0 package + live runtime state:
 *   PRD, DATA_MODEL, RBAC, PROCESS, APP (runtime), WIDGET (experiment)
 */

export const SOURCES = {
  PRD: '01-PRD-NexAccred.md',
  DATA_MODEL: '03-Data-Model-NexAccred.md',
  RBAC: '05-RBAC-Separation-of-Duties.md',
  PROCESS: '04-Business-Process-NexAccred.md',
  APP: 'runtime application state',
  WIDGET: 'docs/widget-readiness-ai-assistant.md (experiment)',
};

const WEIGHTS_TEXT = 'Requirements 20%, Evidence 15%, Personnel 10%, Competence 15%, Operations 10%, Documentation 10%, Assurance 10%, CAPA 10%';

const RULES = [
  {
    id: 'readiness-formula',
    match: ['hitung', 'dihitung', 'calculation', 'calculated', 'formula', 'rumus', 'computed', 'cara kerja', 'how does', 'methodology', 'metodologi', 'weighted', 'tertimbang', 'bobot', 'weight', 'threshold', 'ambang', 'band', 'skor', 'score', 'readiness', 'kesiapan', '87', 'overall'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL', 'PRD', 'APP'],
    answer: (ctx) =>
      `Readiness dihitung live setiap load (tidak pernah disimpan — stored score basi diam-diam):\n` +
      `1) Weighted raw score 8 pilar → raw band. Bobot default: ${WEIGHTS_TEXT}. Threshold: Ready ≥90, Ready with Risks ≥75, Not Yet Ready ≥60, Not Ready <60.\n` +
      `2) Blocking rules hanya MENURUNKAN band: 1 critical gap→Ready with Risks; 2+ critical→Not Yet Ready; Competence <60%→Not Yet Ready; witness outstanding & <30 hari ke visit→Not Yet Ready.\n` +
      `Skor portfolio = rata-rata scheme AKTIF (draft dikecualikan). Tiap hasil membawa reasons[] — "mengapa band beda dari raw score" selalu terjawab.` +
      (ctx?.weights ? `\nBobot aktif sesi ini: ${summarizeWeights(ctx.weights)}.` : ''),
  },
  {
    id: 'readiness-why-capped',
    match: ['kenapa turun', 'why capped', 'why lower', 'turun', 'capped', 'cap ', 'blocking', 'blocked', 'aturan blocking', 'r1', 'r2', 'r3', 'r4', 'blocked by', 'reasons', 'penyebab', 'critical gap', 'critical issue'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL', 'PROCESS'],
    answer: () =>
      `Band turun karena blocking rules (R1–R4), selalu downward-only — rata-rata tinggi tidak boleh menyembunyikan gap kritis:\n` +
      `R1: 1 unresolved critical gap → cap Ready with Risks. R2: ≥2 → Not Yet Ready. ` +
      `R3: pilar Competence <60% → Not Yet Ready. R4: witness outstanding + <30 hari ke AB visit → Not Yet Ready.\n` +
      `Lihat reasons[] pada tiap hasil — itulah penjelasan plain-language-nya. Tutup gap-nya (BP-4 CAPA) atau penuhi witness (BP-5), skor dihitung ulang saat load berikutnya.`,
  },
  {
    id: 'readiness-config',
    match: ['ubah bobot', 'ganti bobot', 'change weight', 'edit weight', 'configure', 'konfigurasi', 'methodology screen', 'layar metodologi', 'audit trail', 'siapa boleh ubah'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL', 'RBAC'],
    answer: () =>
      `Bobot & threshold adalah KONFIGURASI (layar Readiness Methodology, FR-5.7), bukan kode — milik Head of Accreditation. ` +
      `Setiap perubahan audit-trailed (updated_by/updated_at) karena satu bobot bergeser mengubah semua skor portfolio. ` +
      `Normalisasi memakai jumlah bobot, jadi tetap benar walau total ≠100. System Administrator NoAccess — ia tidak bisa menyentuh angka ini (RBAC §3.1).`,
  },
  {
    id: 'draft-scheme',
    match: ['draft', 'draf', 'no score', 'tanpa skor', 'belum ada skor', '0%', 'nol persen'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL', 'PRD'],
    answer: () =>
      `Scheme DRAFT = baru diregister, konfigurasi belum lengkap (langkah 1 dari 2 langkah BP-1). ` +
      `Sengaja TIDAK punya skor: menampilkan 0% menyesatkan, menyembunyikan berarti menyembunyikan work-in-progress. ` +
      `Draft terlihat di Accreditation Scope, dikecualikan dari rata-rata portfolio, dan di upcoming schedule tampil "not yet scheduled". ` +
      `Aktifkan lewat 10-step wizard (supporting standards → IAF/AB rules → competence → processes → evidence → assessment) + requirements per klausul + required document types.`,
  },
  {
    id: 'rbac-matrix',
    match: ['role', 'roles', 'peran', 'permission matrix', 'matriks', 'akses', 'access', 'who can', 'siapa boleh', 'siapa bisa', 'hak akses'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['RBAC'],
    answer: (ctx) =>
      `Matriks domain × level (Requirements, Evidence, Personnel, FindingsCAPA, Reporting, Administration × NoAccess<View<Edit<Approve):\n` +
      `Head: Edit/Edit/Edit/Approve/Edit/View. Staff: Edit/Edit/View/View/View/—. DocController: View/Edit/—/—/View/—. ` +
      `Internal Auditor: View/View/—/Edit/View/—. Impartiality: —/—/—/Edit/View/—. Admin: —/—/—/—/—/Approve.\n` +
      `Role baru = data record (Administration), bukan code change — tapi scoping per-record ("hanya scheme saya") adalah ekstensi v2; saat ini per-domain.` +
      (ctx?.reviewer?.role ? ` Anda mereview sebagai ${ctx.reviewer.title} (${ctx.reviewer.name}).` : ''),
  },
  {
    id: 'rbac-boundaries',
    match: ['boundary', 'batas', 'super-admin', 'superadmin', 'separation', 'pemisahan', 'not a super', 'bukan super', 'independence', 'independensi', 'impartiality', 'imparsial'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['RBAC'],
    answer: () =>
      `Dua batas kritis: (1) Konten bisnis ≠ administrasi sistem — yang menetapkan aturan (Head) beda dari yang mengelola akses (Admin). ` +
      `Admin yang bisa melemahkan requirement diam-diam = temuan nonconformity. (2) Independensi assurance — auditor & Impartiality Committee pegang Edit di FindingsCAPA tapi TIDAK bisa mengubah requirement yang mereka audit (View / NoAccess); kalau bisa, finding hilang dengan redefinisi aturan.\n` +
      `Impartiality Committee role paling restricted by design (NoAccess ke Requirements/Evidence/Personnel) — independensi butuh zero operational stake. ` +
      `Sengaja: tidak ada role yang bisa segalanya. Itu fitur, bukan bug.`,
  },
  {
    id: 'rbac-enforcement',
    match: ['enforcement', 'server-side', 'server side', 'ui-only', 'ui only', 'hanya ui', 'aman', 'secure', 'bypass', 'route langsung', 'production'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['RBAC', 'APP'],
    answer: () =>
      `Filter role di UI ini HANYA kenyamanan — prototype: user yang tahu nama route bisa mencapainya. MUST NOT ship: tiap endpoint API validasi role_permission server-side (guard baca JWT-embedded permissions vs EntityDomain + AccessLevel minimum). ` +
      `Aturan tambahan: cek per domain+level (bukan nama role), tiap perubahan permission masuk audit trail immutable (actor, timestamp, before/after), role tak bisa grant melebihi yang ia miliki (self-escalation guard), session role re-validated tiap request. ` +
      `Readiness strip disembunyikan total (bukan error-box) untuk NoAccess Requirements — menampilkan "dilarang" pun sudah membocorkan ada skor.`,
  },
  {
    id: 'role-guide',
    match: ['dashboard', 'sebagai head', 'sebagai staff', 'sebagai auditor', 'persona', 'tugas saya', 'what should i', 'my task', 'my finding', 'guide my review', 'panduan review', 'mulai dari mana', 'what to review', 'area review'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PROCESS', 'RBAC'],
    answer: (ctx) => roleGuide(ctx),
  },
  {
    id: 'schemes-abs',
    match: ['scheme', 'skema', 'accreditation body', 'kan ', 'ukas', 'anab', 'jas-anz', 'iso 9001', 'iso 14001', 'iso 27001', 'iso 27701', '14064', '17021', '17020', '17024', '17065', '17029', 'scope', 'cakupan'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'DATA_MODEL', 'APP'],
    answer: (ctx) =>
      `Satu AB menaungi banyak scheme; tiap scheme tepat satu AB (multi-AB belum didukung — konfirmasi ke CAB target). ` +
      `AB terdaftar: KAN, UKAS, ANAB (no. akreditasi, negara, accredited-since, status active/suspended/withdrawn). ` +
      `Scheme demo: ISO 9001, ISO 14001, ISO 27001, ISO 27701, ISO 14064-1 = primary standard + N supporting (SCHEME_STANDARD.is_primary). ` +
      `Standar dua tipe: Accreditation (17021-1/17020/17024/17065/17029) vs Supporting (27006-1/27006-2/14065/IAF MD). ` +
      `Onboarding NOL developer (BP-1): AB terdaftar? → standar ada? → Register (Draft) → wizard 10 langkah → requirements → doc types → Activate.` +
      (ctx?.screen ? ` Anda di "${ctx.screen}" — area pilot terkait: accreditation scope & assessment rules.` : ''),
  },
  {
    id: 'requirements-engine',
    match: ['requirement type', 'tipe requirement', 'jenis requirement', 'clause', 'klausul', 'req-', 'ref_code', 'mandatory', 'wajib', 'applicability', 'standard version', 'supersed', 'requirement owner'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'DATA_MODEL'],
    answer: () =>
      `Requirement = unit atomik yang dijelajahi engine (ref_code human-facing mis. REQ-17021-5.2). 12 tipe: Policy, Process, Personnel, Competence, Impartiality, Resource, Operational, Record, Evidence, Monitoring, Review, Effectiveness. ` +
      `Punya mandatory flag, effective/expiry date, applicability rules (scheme/role mana). Standar berversi — CAB bisa transisi antar edisi. ` +
      `Kepemilikan: Head of Accreditation. Hapus standar/requirement yang terpakai DIBLOKIR — nonaktifkan/supersede via expiry_date (riwayat audit retained). Satu compliance record per pasangan (requirement × scheme).`,
  },
  {
    id: 'compliance-evidence',
    match: ['compliance', 'kepatuhan', 'evidence', 'bukti', 'matrix', 'matriks', 'verified', 'expired', 'missing', 'pending', 'compliant', 'non-compliant', 'partially', 'status'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'DATA_MODEL'],
    answer: () =>
      `Compliance Matrix = requirement × 5 kategori evidence (Document, Record, Operational, Personnel, System). ` +
      `Status compliance: Not Assessed, Compliant, Partially Compliant, Non-Compliant, Not Applicable. ` +
      `Status evidence: Verified, Partially Verified, Pending Verification, Missing, Expired — ditentukan 7 atribut (availability, validity, completeness, authenticity, recency, approval, effectiveness), BUKAN keberadaan file (P2: dokumen ada ≠ bukti). ` +
      `Gunakan tab Findings di widget ini untuk mencatat gap evidence per requirement.`,
  },
  {
    id: 'required-docs',
    match: ['required document', 'dokumen wajib', 'document type', 'tipe dokumen', 'should exist', 'seharusnya ada', 'document controller', 'doc control', 'fulfillment', 'bp-7', 'document library'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL', 'PROCESS'],
    answer: () =>
      `Dua tabel menjawab dua pertanyaan (BP-7): REQUIRED_DOCUMENT_TYPE = "dokumen apa yang SEHARUSNYA ada?" (owner: Head) vs DOCUMENT = "apa yang ADA?". ` +
      `fulfillment_status diturunkan dari pencocokan — required tanpa pasangan = Missing, tampil sebagai gap (bukan absen tak terlihat). scheme_id NULL = berlaku semua scheme. ` +
      `Alur: Head definisikan → sistem bandingkan → Missing/Expired → task ke Document Controller → buat/review/approve → feeds pilar Documentation → readiness dihitung ulang.`,
  },
  {
    id: 'findings-capa',
    match: ['finding', 'temuan', 'capa', 'corrective', 'root cause', 'akar masalah', 'closure', 'penutupan', 'major nc', 'minor nc', 'observation', 'ofi', 'risk', 'risiko', 'close finding', 'tutup temuan'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'PROCESS'],
    answer: () =>
      `Sumber finding: Internal Audit, AB Assessment, Witness, Complaint, Appeal, Impartiality/Management Review, Internal Monitoring. ` +
      `Klasifikasi: Major NC / Minor NC / Observation / OFI. Siklus CAPA (BP-4): Correction → Root Cause → Corrective Action → Evidence → Verification → Effective? (tidak→kembali RCA) → Closure → compliance dinilai ulang → readiness dihitung ulang. ` +
      `Setiap finding terhubung ke requirement + scheme + evidence + CAPA. Approve-gated: menutup finding & edit users/roles butuh level Approve (Head) — Internal Auditor (Edit) bisa menaikkan tapi tak bisa menutup. Kategori risk: Accreditation, Scheme, Competence, Operational, Documentation, Evidence, Assessment.`,
  },
  {
    id: 'witness',
    match: ['witness', 'menyaksikan', 'saksi', 'outstanding', 'scheduled', 'assessor', 'pass', 'major nc witness', 'siklus witness'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'DATA_MODEL', 'PROCESS'],
    answer: () =>
      `Witness = AB mengobservasi live audit (BP-5). Dimodelkan sebagai cycle (required vs done per scheme) + event (auditor, assessor AB, tanggal, hasil). ` +
      `Hasil: Pass, Minor NC, Major NC, Scheduled (terjadwal-belum), Outstanding (belum dijadwalkan = risk state). ` +
      `Outstanding tampil duluan & mengumpan blocking R4: outstanding + <30 hari ke visit → cap Not Yet Ready. ` +
      `Witness informal "di kepala orang" adalah penyebab klasik surprise finding — cycle eksplisit membuatnya terlihat sebelum jadi masalah.`,
  },
  {
    id: 'assessment-prep',
    match: ['assessment', 'asesmen', 'visit', 'kunjungan', 'surveillance', 'surveilans', 'reassessment', 'reasesmen', 'scope extension', 'extraordinary', 'countdown', 'jadwal assessment', 'preparation', 'persiapan', 'evidence pack', 'paket bukti', '45', '30 hari', '14', '7-day'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'PROCESS'],
    answer: () =>
      `Tiap scheme terlacak next AB assessment (tipe + tanggal), terurut nearest-first; draft = "not yet scheduled". ` +
      `Tipe: Initial, Surveillance, Reassessment, Scope Extension, Witness, Extraordinary. Notifikasi 45/30/14/7 hari; countdown muncul di dashboard + strip. ` +
      `Preparation wizard mengkompilasi otomatis: skor, critical gaps, high risks, missing evidence, expired competence, open CAPA, previous AB findings, outstanding witness → plan → tasks (owner+due) → Evidence Pack (navigasi internal per requirement — BUKAN auto-expose dokumen rahasia). ` +
      `Critical belum tutup? Eskalasi ke management / pertimbangkan deferral.`,
  },
  {
    id: 'tasks',
    match: ['task', 'tugas', 'overdue', 'terlambat', 'due date', 'tenggat', 'assignee', 'owner', 'filter'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'DATA_MODEL'],
    answer: () =>
      `Tiap gap/risk/finding bermuara ke task: named person + real date (BP). Status: Not Started, In Progress, Done — Overdue DIHITUNG (status≠Done AND due<today), bukan disimpan (flag tersimpan butuh nightly job & salah di antaranya). ` +
      `Filter All/Open/Overdue/Done; source_ref polimorfik menunjuk asal (requirement/finding/CAPA/risk) — task selalu bisa dilacak "mengapa ia ada".`,
  },
  {
    id: 'personnel-aihcm',
    match: ['aihcm', 'personnel', 'personel', 'competence', 'kompetensi', 'competency', 'auditor authorization', 'otorisasi auditor', 'expiry', 'kedaluwarsa', 'lead auditor', 'employee', 'karyawan', '8080'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL', 'PRD'],
    answer: () =>
      `Personnel & Competence = read-only dari AIHCM (sibling real, Java 21/Spring di :8080): login {tenantCode,email,password}→JWT (tanpa tenant header); ` +
      `GET /api/v1/competencies/employees/{id} (level BEGINNER→EXPERT); GET /api/v1/competencies (katalog); GET /api/v1/employees/{id} (profil, tanpa email). ` +
      `Gap by design: AIHCM tak punya expiry & otorisasi — level umum ≠ izin time-bound sebagai lead auditor standar X. ` +
      `Maka AUDITOR_AUTHORIZATION adalah tabel milik NexAccred (personnel_ref→employeeId AIHCM; scope+standar+role+expiry milik sendiri, owned by Head) — dibaca witness & pilar Competence. Kompetensi kedaluwarsa diam-diam = scheme non-compliant diam-diam.`,
  },
  {
    id: 'platform-audit',
    match: ['platform audit', 'audit execution', 'technical review', 'certification decision', 'certificate issuance', 'stub', 'aplikasi audit'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD', 'DATA_MODEL', 'PROCESS'],
    answer: () =>
      `Platform Audit = system-of-record 4 domain (Application & Certification Lifecycle, Audit Execution, Technical Review, Certification Decisions). ` +
      `Belum ada aplikasinya → dikonsumsi via PlatformAuditStubGateway berlabel jelas (data sampel realistis), diganti HTTP adapter satu baris saat API-nya ada. ` +
      `Aturan batas (P6): NexAccred read-only + TIDAK PERNAH write-back; layar seeksyen ditandai sistem+sinkronisasinya. Graceful degrade "data unavailable" bila stub mati.`,
  },
  {
    id: 'principles',
    match: ['prinsip', 'principle', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'apa itu nexaccred', 'what is nexaccred', 'bukan', 'tagline', 'positioning', 'competitor', 'beda', 'differentiator', 'rantai', 'chain'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD'],
    answer: () =>
      `NexAccred = readiness engine ("If the AB comes tomorrow, are we ready?") — BUKAN DMS, checklist ISO, audit tool generik, atau dashboard. ` +
      `Rantai: Requirement→Scheme→Process→Personnel→Competence→Document→Evidence→Implementation→Assessment→Finding→CAPA→Risk→Readiness. ` +
      `Pembedanya: kompetitor tahu dokumen apa yang Anda punya; NexAccred tahu apakah Anda LULUS, mengapa tidak, dan apa dulu yang diperbaiki — kontinu & traceable. ` +
      `7 prinsip: P1 configuration-driven (tambah AB/skema tanpa developer), P2 evidence-based, P3 computed-readiness, P4 blocking>average, P5 separation-of-duties, P6 jangan duplikasi system-of-record, P7 guide by intent (user tak perlu hafal klausul). ` +
      `Out of scope v1: review aplikasi, scheduling, penerbitan sertifikat (→Platform Audit); manajemen kompetensi (→AIHCM); portal klien; billing; mobile native.`,
  },
  {
    id: 'gate',
    match: ['gate', 'baseline', 'sign-off', 'signoff', 'approval', 'approve', 'persetujuan', 'ready e2e', 'siap development', 'change request', 'perubahan', 'scope change', 'revisi'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['WIDGET', 'PROCESS'],
    answer: () =>
      `Prototype Ready ≠ Requirement Ready ≠ Development Ready. Gate widget ini: 9 area review 100% + 0 open blocker. ` +
      `Status: PENDING / APPROVED / APPROVED_WITH_EXCEPTIONS / REJECTED / SUPERSEDED — selalu terhadap VERSI SPESIFIK + scope + timestamp. ` +
      `Pasca-baseline: New/Changed Requirement → Change Request → Impact Assessment → Human Decision → Recorded Approval → Planning → Implementation → Verification. ` +
      `Wajib terjawab: sudah adakah saat baseline? kapan muncul? siapa pengusul & penyetuju? versi & sprint terdampak? defect-vs-baseline atau scope change?`,
  },
  {
    id: 'evidence-model',
    match: ['evidence model', 'finding capture', 'catat finding', 'APA yang dicatat', 'jejak audit', 'audit trail', 'immutable', 'traceability', 'telusur'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['WIDGET', 'PRD'],
    answer: () =>
      `Tiap finding: project, versi, env, sesi, identitas+peran, route/screen, Q&A, sumber, klasifikasi, severity, owner, keputusan+pengambil, versi hasil, verifikasi, relasi approval. ` +
      `Auditability = stored events + human decisions (Evidence Over Blame — sistem tak menuding, hanya menyediakan jejak). ` +
      `NFR: tiap aksi state-changing tercatat immutable (who/what/when/entity); tiap klaim readiness traceable ke requirement + evidence; perubahan bobot & permission audit-trailed.`,
  },
  {
    id: 'demo-accounts',
    match: ['demo', 'login', 'akun', 'account', 'email', 'password', 'masuk sebagai', 'sign in', 'kredensial', 'credential'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['APP'],
    answer: () =>
      `6 akun demo (password di nexaccred-api/README, seeded via prisma/seed.ts): joan.marsh@ (Head), m.santos@ (Internal Auditor), k.devi@ (Impartiality), rahayu.ningsih@ (Staff), helda.mutiara@ (DocController), r.alvi@ (Admin) — domain @nexaccred.io. ` +
      `Login live = POST /auth/login sungguhan (JWT). Butuh API :3001 + Postgres 5433 + migrate + seed; bila "Login rejected" → seed belum jalan. ` +
      `Tanpa backend, pakai build standalone (review lokal, tanpa auth).`,
  },
  {
    id: 'troubleshoot',
    match: ['error', 'gagal', 'failed', 'tidak bisa', 'cannot', 'could not reach', 'is it running', 'down', 'mati', 'blank', 'putih', 'kosong', 'loading', 'macet', 'stuck', 'rejected', 'ditolak', '5433', '3001', '5173', 'seed'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['APP'],
    answer: () =>
      `"Could not reach API :3001" → API mati: pastikan Postgres 5433 jalan (pg_ctl ~/.nexaccred-pg), prisma migrate deploy + seed sudah, npm run start:dev di nexaccred-api. ` +
      `Cek cepat: node nexaccred-api/test/api-smoke.mjs harus GREEN. "Login rejected" → seed belum (npx ts-node prisma/seed.ts). ` +
      `Halaman putih/blank → crash render; cek console browser + dev log; pola yang pernah terjadi: snapshot store tak stabil (sudah ada smoke test-nya). ` +
      `Readiness strip hilang untuk Impartiality/Admin = by design (NoAccess), bukan bug.`,
  },
  {
    id: 'ai-layer',
    match: ['ai ', 'kecerdasan', 'assistant', 'gap analysis', 'simulator', 'impact analysis', 'evidence finder', 'readiness advisor', 'change assistant', 'violet', 'ungu', 'advisory', 'chatbot'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['PRD'],
    answer: () =>
      `AI NexAccred (FR-10) beroperasi di atas compliance graph terstruktur — BUKAN chatbot generik: tiap jawaban sitasi requirement/dokumen/evidence; ` +
      `fungsi: Accreditation Assistant, Gap Analysis, Assessment Simulator, Evidence Finder, Impact Analysis, Readiness Advisor, Change Assistant. ` +
      `AI DILARANG memutuskan compliance formal — advisory berlabel jelas; konten AI ditandai aksen violet agar tak tertukar system-of-record. ` +
      `Widget ini mengikuti aturan yang sama: menjawab hanya dari sumber approved, menolak mengarang, tak pernah approve.`,
  },
  {
    id: 'delete-rules',
    match: ['hapus', 'delete', 'deactivate', 'nonaktif', 'delet'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['DATA_MODEL'],
    answer: () =>
      `Aturan integritas: hapus standar DIBLOKIR bila scheme mereferensikannya (deactivate saja); hapus requirement diblokir bila compliance/finding ada (supersede via expiry_date); ` +
      `hapus scheme diblokir bila sertifikasi klien aktif; supersede versi standar = versi baru + lama bertanggal, riwayat retained; audit trail append-only (tak pernah update/delete); ` +
      `evidence retained ≥1 siklus akreditasi penuh setelah expiry.`,
  },
  {
    id: 'pilot',
    match: ['pilot', 'review surface', 'experiment', 'eksperimen', 'widget', 'version', 'versi'],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['WIDGET'],
    answer: (ctx) =>
      `Pilot: review surface NEXACCRED menguji role-based access, readiness calculation, scope, assessment rules, critical/major issues, personnel & competence, document/evidence, impartiality, approval boundary. ` +
      `Versi prototipe sesi ini: ${ctx?.prototypeVersion || 'tak tercatat'} — findings terikat versi ini selamanya.` +
      (ctx?.screen ? ` Layar aktif "${ctx.screen}": ${pilotHint(ctx.route)}.` : ''),
  },
];

/**
 * Best-match wins: rule dengan hit keyword terbanyak menjawab.
 * Skor 0 → CLARIFICATION_NEEDED (jujur tidak tahu + arahan jadi finding).
 */
export function answerQuestion(question, ctx = {}) {
  const q = (question || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.match) {
      if (kw && q.includes(kw)) score += kw.length > 4 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  if (best) {
    return {
      answer: best.answer(ctx),
      sources: best.sources.map((s) => SOURCES[s]),
      classification: best.classification,
    };
  }
  return {
    answer:
      `Saya tidak menemukan approved source untuk pertanyaan itu di paket NEXACCRED ` +
      `v1.0 (PRD / Data Model / RBAC / Business Process) atau runtime state — jadi ` +
      `saya tidak akan mengarang expected behavior. Saran: catat sebagai finding ` +
      `klasifikasi REQUIREMENT_GAP atau UNRESOLVED_QUESTION di tab Findings, lalu ` +
      `minta triage manusia. Itu tepat guna widget ini: mengubah pertanyaan ` +
      `menjadi structured evidence, bukan jawaban karangan.`,
    sources: [],
    classification: 'CLARIFICATION_NEEDED',
  };
}

function summarizeWeights(weights) {
  try {
    return Object.entries(weights).map(([k, v]) => `${k} ${v}%`).join(', ');
  } catch {
    return '';
  }
}

function roleGuide(ctx = {}) {
  const r = ctx?.reviewer?.role;
  const heads = {
    head: 'Anda Head of Accreditation: gauge readiness, semua scheme, "why not ready", fix-first — target <60 detik jawab "are we ready?".',
    staff: 'Anda Accreditation Staff: task queue, scheme in setup, workload snapshot — kerja prioritas dari task.',
    auditor: 'Anda Internal Auditor: my findings + kalender internal assessment — nilai dengan graph yang sama dipakai assessor AB.',
    impartiality: 'Anda Impartiality Committee: declarations + safeguard watch saja — tanpa noise operasional.',
    doccontrol: 'Anda Document Controller: evidence needing attention, records pending, pack completeness — Anda tahu apa yang SEHARUSNYA ada.',
    admin: 'Anda System Administrator: users/roles/integrations/audit trail — tanpa konten compliance, tanpa gauge (dijelaskan di layar, by design).',
  };
  const personal = heads[r] || 'Pilih role saat login — tiap dashboard purpose-built, bukan salinan dipangkas.';
  const screen = ctx?.screen
    ? ` Layar "${ctx.screen}" (route ${ctx.route}): ${pilotHint(ctx.route)}.`
    : '';
  return `${personal}${screen} Tiap role operasional mengumpan loop readiness (BP-8); admin di luar loop.`;
}

function pilotHint(route = '') {
  if (route.includes('methodology')) return 'uji transparansi formula: ubah bobot/threshold, lihat reasons[] berubah';
  if (route.includes('readiness')) return 'uji readiness calculation & penjelasan band-vs-raw';
  if (route.includes('scheme') || route.includes('scope') || route.includes('ab')) return 'uji accreditation scope, status draft vs active, & assessment rules';
  if (route.includes('personnel')) return 'uji personnel & competence (batas AIHCM vs Auditor Authorization)';
  if (route.includes('document') || route.includes('evidence') || route.includes('requirement') || route.includes('compliance')) return 'uji document/evidence (P2: existence ≠ proof; required vs actual)';
  if (route.includes('impartiality')) return 'uji impartiality & approval boundary (siapa boleh tutup finding)';
  if (route.includes('finding') || route.includes('capa') || route.includes('risk')) return 'uji critical/major issues + siklus CAPA';
  if (route.includes('witness')) return 'uji witness cycle & blocking R4 (<30 hari)';
  if (route.includes('user') || route.includes('role') || route.includes('task')) return 'uji role-based access (admin zero-domain rule)';
  if (route.includes('standard')) return 'uji standard versioning & supersede (bukan delete)';
  return 'uji requirement-gap detection umum';
}

export const CLASSIFICATIONS = [
  'ANSWERED_FROM_SOURCE',
  'CLARIFICATION_NEEDED',
  'REQUIREMENT_GAP',
  'UNRESOLVED_QUESTION',
  'EDGE_CASE',
  'SUGGESTION',
  'CORRECTION',
  'PROTOTYPE_DEFECT',
  'IMPLEMENTATION_DEFECT',
  'CHANGE_REQUEST',
  'OUT_OF_SCOPE',
];
