/**
 * Measure how many realistic reviewer questions the assistant can answer.
 *
 * The number that mattered before this script existed was measured against
 * questions asked *inside* the app's screens — and on 2026-09-21 the collector
 * showed that **all 12 questions ever asked in this prototype were asked on
 * the login screen**, where coverage was far worse. A coverage figure that
 * excludes the screen everybody actually uses is not a coverage figure.
 *
 * So the battery is split, and the login section is reported separately: an
 * overall average can hide a total failure on first contact.
 *
 * Run: node scripts/coverage-battery.mjs   (exit 1 if any section regresses
 * below its floor, so it can be wired into a gate later)
 */
import { answerQuestion } from '../src/widget/knowledge.js';

const BATTERY = {
  'Layar login (kontak pertama)': [
    'Aplikasi ini untuk apa?',
    'Ini aplikasi apa?',
    'Siapa saja usernya?',
    'Siapa aja user nya?',
    'User apa saja yang ada?',
    'Ada akun demo?',
    'Login sebagai apa?',
    'Bagaimana cara masuk?',
    'Mulai dari mana?',
    'Apa itu NexAccred?',
    'Role apa saja yang tersedia?',
    'Saya harus sign in sebagai siapa?',
  ],
  'Orientasi menu dan modul': [
    'Ada menu apa saja?',
    'Modul apa saja yang tersedia?',
    'Fitur apa saja di aplikasi ini?',
    'Halaman apa saja yang ada?',
  ],
  'Peran dan kewenangan': [
    'Apa yang bisa dilakukan Head of Accreditation?',
    'Akses internal auditor apa saja?',
    'Impartiality Committee bisa lihat apa?',
    'Apa itu document controller?',
  ],
  'Isi aplikasi': [
    'Apa aturan blocking?',
    'Bagaimana readiness dihitung?',
    'Apa itu CAPA?',
    'Bagaimana evidence dinilai?',
  ],
};

const FLOOR = { 'Layar login (kontak pertama)': 1.0 };

let overallOk = 0;
let overallTotal = 0;
let failed = false;

for (const [section, questions] of Object.entries(BATTERY)) {
  let ok = 0;
  const misses = [];
  for (const q of questions) {
    const r = answerQuestion(q, { route: 'login', screen: 'login' });
    if (r.classification === 'ANSWERED_FROM_SOURCE') ok += 1;
    else misses.push(q);
  }
  const pct = Math.round((ok / questions.length) * 100);
  overallOk += ok;
  overallTotal += questions.length;
  console.log(`${pct === 100 ? 'PASS' : 'WARN'}  ${section}: ${ok}/${questions.length} (${pct}%)`);
  for (const m of misses) console.log(`      belum terjawab: ${m}`);
  const floor = FLOOR[section];
  if (floor !== undefined && ok / questions.length < floor) {
    console.log(`FAIL  ${section} di bawah ambang ${Math.round(floor * 100)}%`);
    failed = true;
  }
}

const overallPct = Math.round((overallOk / overallTotal) * 100);
console.log(`\nTOTAL: ${overallOk}/${overallTotal} (${overallPct}%)`);
console.log(failed ? 'RED (ada section di bawah ambang)' : 'GREEN');
process.exit(failed ? 1 : 0);
