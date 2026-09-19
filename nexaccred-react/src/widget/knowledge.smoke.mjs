/**
 * Knowledge matcher regression set (TDD, docs/ai-assistant-widget-rollout-
 * plan.md Fase 2a). Captures the exact questions that broke the matcher
 * before (commit dcb8aee) and the substring traps its own fix left behind
 * (`'r1'` inside "Q1", `'ai '` inside "email ", `'kan '` inside
 * "bagaimana"). answerQuestion(question, ctx) -> {answer, sources,
 * classification} is the contract under test; it must not change shape.
 *
 * Run: node src/widget/knowledge.smoke.mjs   (exit 0 = GREEN)
 */
import { answerQuestion } from './knowledge.js';

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

function expectAnswered(question, expectedRuleHint, ctx = {}) {
  const r = answerQuestion(question, ctx);
  const ok = r.classification === 'ANSWERED_FROM_SOURCE';
  check(`"${question}" -> ANSWERED_FROM_SOURCE`, ok,
    ok ? '' : `got ${r.classification}`);
  if (ok && expectedRuleHint) {
    check(`  ...and mentions "${expectedRuleHint}"`,
      r.answer.toLowerCase().includes(expectedRuleHint.toLowerCase()));
  }
}

function expectClarification(question) {
  const r = answerQuestion(question);
  check(`"${question}" -> CLARIFICATION_NEEDED (genuinely out of scope)`,
    r.classification === 'CLARIFICATION_NEEDED', `got ${r.classification}`);
}

// --- the exact question that forced dcb8aee ---------------------------
expectAnswered('apa aturan blocking?', 'r1');

// --- substring traps the dcb8aee keyword-add left behind ----------------
// 'r1'..'r4' must not fire on an unrelated "Q1"/"Q2" mention.
expectClarification('target Q1 2026 apa saja?');
// 'ai ' must not fire on "email".
// 'email' is a legitimate keyword for demo-accounts (login credential
// questions), not a trap -- confirm it still answers, doesn't clarify.
expectAnswered('kirim notifikasi lupa password ke email mana?', 'demo');
// 'kan ' must not fire on any word merely containing "kan" as a substring
// (bagaimana, akan, dikan-...); only a standalone "kan" should ever count.
expectAnswered('bagaimana readiness dihitung?', 'weight');
// 'direvisi' legitimately matches root 'revisi' (gate rule, change-request
// process) -- Indonesian affix tolerance working as intended, not a trap.
expectAnswered('requirement ini akan direvisi minggu depan, bagaimana prosesnya?', 'change request');
// 'cap ' (trailing-space hack in the old matcher) must not misfire on
// "capable"/"capacity"-shaped words.
expectClarification('apakah sistem ini capable menangani ribuan user?');
// 'p1'..'p7' must not fire on ordinary words containing that substring
// (e.g. "p1" inside "grup1", "tipe2").
expectClarification('apa isi folder tahap1 dan folder tahap2 di komputer saya?');

// --- breadth: representative ID + EN questions per rule, so a future
// matcher change gets caught by more than one lucky hit -----------------
expectAnswered('bagaimana readiness score dihitung?', 'weight');
expectAnswered('how is the readiness score calculated?', 'weight');
expectAnswered('kenapa turun ke ready with risks?', 'r1');
expectAnswered('why did the band get capped to not yet ready?', 'r2');
expectAnswered('siapa boleh ubah bobot readiness?');  // readiness-formula/-config both plausible; classification is what matters
expectAnswered('kenapa scheme ini masih 0%?', 'draft');
expectAnswered('siapa saja yang punya akses ke matriks izin?', 'matriks');
expectAnswered('apa batas antara admin dan super-admin?', 'admin');
expectAnswered('apakah enforcement RBAC ini server-side atau cuma UI?', 'server');
expectAnswered('sebagai head of accreditation saya harus mulai dari mana?', 'gauge readiness', { reviewer: { role: 'head' } });
expectAnswered('what is my role guide as an internal auditor?', 'auditor', { reviewer: { role: 'auditor' } });
expectAnswered('apa itu accreditation body dalam skema ini?', 'accreditation body'.split(' ')[0]);
expectAnswered('requirement type apa saja yang mandatory?', 'mandatory');
expectAnswered('bagaimana status compliance evidence dihitung?', 'evidence');
expectAnswered('dokumen apa saja yang menjadi tanggung jawab document controller?', 'document');
expectAnswered('bagaimana proses closure sebuah finding CAPA?', 'root cause');
expectAnswered('berapa lama witness outstanding sebelum jadi blocker?', 'witness');
expectAnswered('apa saja yang perlu disiapkan sebelum assessment visit?', 'assessment');
expectAnswered('bagaimana cara memfilter task yang overdue?', 'task');
expectAnswered('apa itu AIHCM dan bedanya dengan auditor authorization?', 'aihcm');
expectAnswered('apakah NexAccred menduplikasi data dari platform audit?', 'platform audit'.split(' ')[0]);
expectAnswered('apa saja prinsip P1 sampai P7 di NexAccred?', 'prinsip');
expectAnswered('apa itu gate readiness dan sign-off?', 'gate');
expectAnswered('bagaimana evidence model mencatat sebuah finding?', 'evidence');
expectAnswered('akun demo apa saja yang bisa dipakai login?', 'demo');
expectAnswered('kenapa halaman ini blank/putih setelah login?', 'blank');
expectAnswered('apa peran AI assistant di aplikasi ini?', 'advisory');
expectAnswered('apakah data bisa dihapus permanen dari sini?', 'diblokir');
expectAnswered('apa itu pilot review surface NEXACCRED ini?', 'pilot');

// --- genuinely out of scope: must stay honest, not force a bad match ---
expectClarification('bagaimana cuaca hari ini di Jakarta?');
expectClarification('siapa presiden Indonesia saat ini?');
expectClarification('tolong buatkan saya resep nasi goreng');

console.log(failures === 0 ? '\nGREEN (knowledge)' : `\nRED (knowledge) — ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
