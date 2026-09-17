import { AccessLevel, EntityDomain, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'NexAccred123!';

/**
 * The RBAC permission matrix, copied verbatim from
 * 05-RBAC-Separation-of-Duties.md §2 for the 6 roles the frontend prototype
 * implements (the doc's other 5 rows — Top Management, Certification
 * Manager, Lead Auditor, Technical Reviewer — have no corresponding
 * nexaccred-react role yet, so they're not seeded).
 */
const ROLE_PERMISSIONS: Record<string, Record<EntityDomain, AccessLevel>> = {
  'Head of Accreditation': {
    Requirements: 'Edit',
    Evidence: 'Edit',
    Personnel: 'Edit',
    FindingsCAPA: 'Approve',
    Reporting: 'Edit',
    Administration: 'View',
  },
  'Internal Auditor': {
    Requirements: 'View',
    Evidence: 'View',
    Personnel: 'NoAccess',
    FindingsCAPA: 'Edit',
    Reporting: 'View',
    Administration: 'NoAccess',
  },
  'Impartiality Committee': {
    Requirements: 'NoAccess',
    Evidence: 'NoAccess',
    Personnel: 'NoAccess',
    FindingsCAPA: 'Edit',
    Reporting: 'View',
    Administration: 'NoAccess',
  },
  'Accreditation Staff': {
    Requirements: 'Edit',
    Evidence: 'Edit',
    Personnel: 'View',
    FindingsCAPA: 'View',
    Reporting: 'View',
    Administration: 'NoAccess',
  },
  'Document Controller': {
    Requirements: 'View',
    Evidence: 'Edit',
    Personnel: 'NoAccess',
    FindingsCAPA: 'NoAccess',
    Reporting: 'View',
    Administration: 'NoAccess',
  },
  'System Administrator': {
    Requirements: 'NoAccess',
    Evidence: 'NoAccess',
    Personnel: 'NoAccess',
    FindingsCAPA: 'NoAccess',
    Reporting: 'NoAccess',
    Administration: 'Approve',
  },
};

/** Mirrors nexaccred-react/src/data/roles.js's ROLES so the seeded logins
 *  match the personas the frontend prototype already shows on its role picker. */
const DEMO_USERS = [
  { fullName: 'Joan Marsh', email: 'joan.marsh@nexaccred.io', roleName: 'Head of Accreditation' },
  { fullName: 'Maria Santos', email: 'm.santos@nexaccred.io', roleName: 'Internal Auditor' },
  { fullName: 'K. Devi', email: 'k.devi@nexaccred.io', roleName: 'Impartiality Committee' },
  { fullName: 'Rahayu Ningsih', email: 'rahayu.ningsih@nexaccred.io', roleName: 'Accreditation Staff' },
  { fullName: 'Helda Mutiara', email: 'helda.mutiara@nexaccred.io', roleName: 'Document Controller' },
  { fullName: 'R. Alvi', email: 'r.alvi@nexaccred.io', roleName: 'System Administrator' },
];

async function seedRolesAndUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const [roleName, domains] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName, description: `Seeded from 05-RBAC-Separation-of-Duties.md §2` },
    });

    for (const [entityDomain, accessLevel] of Object.entries(domains) as [EntityDomain, AccessLevel][]) {
      await prisma.rolePermission.upsert({
        where: { roleId_entityDomain: { roleId: role.id, entityDomain } },
        update: { accessLevel },
        create: { roleId: role.id, entityDomain, accessLevel },
      });
    }
  }

  for (const demoUser of DEMO_USERS) {
    const role = await prisma.role.findUniqueOrThrow({ where: { roleName: demoUser.roleName } });
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        fullName: demoUser.fullName,
        email: demoUser.email,
        passwordHash,
        roleId: role.id,
        status: 'Active',
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded 6 roles (RBAC §2 matrix) and 6 demo users, all password "${DEMO_PASSWORD}".`);
}

/**
 * Seeds the two ExternalSystem registry rows (required before any adapter's
 * sync log write can resolve a system by code — see
 * infrastructure/persistence/prisma/external-sync-log.prisma.repository.ts)
 * plus a minimal accreditation/scheme dataset so `GET /schemes` and
 * `GET /schemes/:id/readiness` return something real on a fresh clone,
 * mirroring the sample data already in nexaccred-react/src/data.
 */
async function main() {
  await seedRolesAndUsers();

  await prisma.externalSystem.upsert({
    where: { code: 'PLATFORM_AUDIT' },
    update: {},
    create: {
      code: 'PLATFORM_AUDIT',
      displayName: 'Platform Audit',
      baseUrl: process.env.PLATFORM_AUDIT_BASE_URL ?? 'http://localhost:9090',
      authType: 'ApiKey',
      enabled: false, // no live app yet — stub adapter is used regardless
    },
  });

  await prisma.externalSystem.upsert({
    where: { code: 'AIHCM' },
    update: {},
    create: {
      code: 'AIHCM',
      displayName: 'AIHCM',
      baseUrl: process.env.AIHCM_BASE_URL ?? 'http://localhost:8080',
      authType: 'JWT',
      enabled: true,
    },
  });

  await seedAccreditationScope();

  // eslint-disable-next-line no-console
  console.log('Seed complete: ExternalSystem (PLATFORM_AUDIT, AIHCM), 3 AccreditationBodies, 5 Schemes with pillar scores, witness cycles, assessments, and the critical findings that drive their blocking rules.');
}

/**
 * Ports nexaccred-react/src/data/schemes.js's 3 accreditation bodies and 5
 * schemes into the database — same names, same pillar scores, same scheme
 * keys as scheme IDs (so the frontend can fetch backend-computed readiness
 * for "iso27001" etc. using the exact key it already uses locally for the
 * richer per-scheme narrative it hasn't been ported yet — see nexaccred-api
 * README's "what's deliberately not built yet").
 *
 * Only what the readiness ENGINE needs is modeled here: pillar scores,
 * witness cycles, next assessment, and — critically — the open Major NC
 * findings that drive each scheme's blocking rule, matching
 * `tabs.critical.length` in the frontend's sample data exactly (iso27001: 1,
 * iso27701: 2, the other three: 0). The narrative flavor text in each
 * scheme's `tabs.risks/evidence/competence` is NOT modeled as Risk/Evidence
 * rows — that would need a much larger modelling pass to map faithfully,
 * and isn't required for the readiness score/band to be correct.
 */
async function seedAccreditationScope() {
  const kan = await prisma.accreditationBody.upsert({
    where: { accreditationNumber: 'KAN-LSSM-045-IDN' },
    update: {},
    create: {
      shortName: 'KAN',
      fullName: 'Komite Akreditasi Nasional',
      country: 'Indonesia',
      accreditationNumber: 'KAN-LSSM-045-IDN',
      accreditedSince: new Date('2019-03-14'),
      status: 'Active',
    },
  });
  const ukas = await prisma.accreditationBody.upsert({
    where: { accreditationNumber: 'UKAS-CB-0056' },
    update: {},
    create: {
      shortName: 'UKAS',
      fullName: 'United Kingdom Accreditation Service',
      country: 'United Kingdom',
      accreditationNumber: 'UKAS-CB-0056',
      accreditedSince: new Date('2021-06-02'),
      status: 'Active',
    },
  });
  const anab = await prisma.accreditationBody.upsert({
    where: { accreditationNumber: 'ANAB-CB-1122' },
    update: {},
    create: {
      shortName: 'ANAB',
      fullName: 'ANSI National Accreditation Board',
      country: 'United States',
      accreditationNumber: 'ANAB-CB-1122',
      accreditedSince: new Date('2023-11-19'),
      status: 'Active',
    },
  });

  // Minimal Standard → StandardVersion → Clause → Requirement chain — just
  // enough to give the critical Findings below a real FK, not a full
  // requirement library (that's Requirements-module seed territory).
  const std17021 = await prisma.standard.upsert({
    where: { id: 'seed-std-17021' },
    update: {},
    create: {
      id: 'seed-std-17021',
      name: 'ISO/IEC 17021-1',
      type: 'Accreditation',
      issuer: 'ISO/IEC',
      status: 'Active',
    },
  });
  const std17021v = await prisma.standardVersion.upsert({
    where: { id: 'seed-std-17021-v2015' },
    update: {},
    create: { id: 'seed-std-17021-v2015', standardId: std17021.id, versionLabel: '2015', effectiveDate: new Date('2015-01-01') },
  });
  const std27006 = await prisma.standard.upsert({
    where: { id: 'seed-std-27006-2' },
    update: {},
    create: {
      id: 'seed-std-27006-2',
      name: 'ISO/IEC 27006-2',
      type: 'Supporting',
      issuer: 'ISO/IEC',
      status: 'Active',
    },
  });
  const std27006v = await prisma.standardVersion.upsert({
    where: { id: 'seed-std-27006-2-v2021' },
    update: {},
    create: { id: 'seed-std-27006-2-v2021', standardId: std27006.id, versionLabel: '2021', effectiveDate: new Date('2021-01-01') },
  });

  const clause52 = await prisma.clause.upsert({
    where: { id: 'seed-clause-5.2' },
    update: {},
    create: { id: 'seed-clause-5.2', standardVersionId: std17021v.id, clauseNumber: '5.2', title: 'Impartiality' },
  });
  const clause723 = await prisma.clause.upsert({
    where: { id: 'seed-clause-7.2.3' },
    update: {},
    create: { id: 'seed-clause-7.2.3', standardVersionId: std27006v.id, clauseNumber: '7.2.3', title: 'Competence of personnel' },
  });
  const clause84 = await prisma.clause.upsert({
    where: { id: 'seed-clause-8.4' },
    update: {},
    create: { id: 'seed-clause-8.4', standardVersionId: std27006v.id, clauseNumber: '8.4', title: 'Privacy risk assessment' },
  });

  const req5_2 = await prisma.requirement.upsert({
    where: { refCode: 'REQ-17021-5.2' },
    update: {},
    create: {
      refCode: 'REQ-17021-5.2',
      clauseId: clause52.id,
      requirementText: 'Impartiality — risks to impartiality identified on an ongoing basis',
      requirementType: 'MANDATORY_CLAUSE',
      mandatory: true,
      effectiveDate: new Date('2015-01-01'),
    },
  });
  const req7_2_3 = await prisma.requirement.upsert({
    where: { refCode: 'REQ-27701-7.2.3' },
    update: {},
    create: {
      refCode: 'REQ-27701-7.2.3',
      clauseId: clause723.id,
      requirementText: 'Competence of personnel involved in privacy information management certification activity',
      requirementType: 'MANDATORY_CLAUSE',
      mandatory: true,
      effectiveDate: new Date('2021-01-01'),
    },
  });
  const req8_4 = await prisma.requirement.upsert({
    where: { refCode: 'REQ-27701-8.4' },
    update: {},
    create: {
      refCode: 'REQ-27701-8.4',
      clauseId: clause84.id,
      requirementText: 'Privacy risk assessment records maintained for each client cycle',
      requirementType: 'MANDATORY_CLAUSE',
      mandatory: true,
      effectiveDate: new Date('2021-01-01'),
    },
  });

  interface SchemeSeed {
    id: string;
    name: string;
    fullName: string;
    abId: string;
    clientCount: number;
    pillars: Record<string, number>;
    witness: { required: number; completed: number };
    nextAssessment: { type: string; date: string };
    criticalFindings: { code: string; requirementId: string }[];
  }

  const schemes: SchemeSeed[] = [
    {
      id: 'iso9001',
      name: 'ISO 9001',
      fullName: 'Quality Management Systems',
      abId: kan.id,
      clientCount: 64,
      pillars: { Requirements: 97, Evidence: 96, Personnel: 95, Competence: 96, Operations: 97, Documentation: 98, Assurance: 95, CAPA: 97 },
      witness: { required: 2, completed: 2 },
      nextAssessment: { type: 'Surveillance', date: '2026-11-20' },
      criticalFindings: [],
    },
    {
      id: 'iso14001',
      name: 'ISO 14001',
      fullName: 'Environmental Management Systems',
      abId: kan.id,
      clientCount: 38,
      pillars: { Requirements: 95, Evidence: 91, Personnel: 94, Competence: 93, Operations: 92, Documentation: 96, Assurance: 93, CAPA: 92 },
      witness: { required: 2, completed: 2 },
      nextAssessment: { type: 'Surveillance', date: '2026-10-05' },
      criticalFindings: [],
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      fullName: 'Information Security Management Systems',
      abId: kan.id,
      clientCount: 41,
      pillars: { Requirements: 94, Evidence: 82, Personnel: 91, Competence: 88, Operations: 91, Documentation: 95, Assurance: 92, CAPA: 87 },
      witness: { required: 3, completed: 2 },
      nextAssessment: { type: 'Surveillance', date: '2026-09-13' },
      criticalFindings: [{ code: 'FND-2026-CAPA014', requirementId: req5_2.id }],
    },
    {
      id: 'iso27701',
      name: 'ISO 27701',
      fullName: 'Privacy Information Management Systems',
      abId: ukas.id,
      clientCount: 14,
      pillars: { Requirements: 82, Evidence: 58, Personnel: 74, Competence: 52, Operations: 71, Documentation: 79, Assurance: 70, CAPA: 68 },
      witness: { required: 2, completed: 0 },
      nextAssessment: { type: 'Initial', date: '2026-08-25' },
      criticalFindings: [
        { code: 'FND-2026-7.2.3', requirementId: req7_2_3.id },
        { code: 'FND-2026-8.4', requirementId: req8_4.id },
      ],
    },
    {
      id: 'iso14064',
      name: 'ISO 14064-1',
      fullName: 'Greenhouse Gas Quantification & Verification',
      abId: anab.id,
      clientCount: 9,
      pillars: { Requirements: 90, Evidence: 81, Personnel: 86, Competence: 78, Operations: 87, Documentation: 88, Assurance: 85, CAPA: 84 },
      witness: { required: 2, completed: 1 },
      nextAssessment: { type: 'Surveillance', date: '2026-12-01' },
      criticalFindings: [],
    },
  ];

  for (const s of schemes) {
    const scheme = await prisma.scheme.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        accreditationBodyId: s.abId,
        name: s.name,
        fullName: s.fullName,
        conformityType: 'CertificationBody',
        lifecycleStatus: 'active',
        clientCount: s.clientCount,
      },
    });

    for (const [pillar, scorePct] of Object.entries(s.pillars)) {
      await prisma.schemePillarScore.upsert({
        where: { schemeId_pillar: { schemeId: scheme.id, pillar: pillar as never } },
        update: { scorePct },
        create: { schemeId: scheme.id, pillar: pillar as never, scorePct },
      });
    }

    await prisma.witnessCycle.upsert({
      where: { id: `${scheme.id}-witness-cycle` },
      update: { requiredCount: s.witness.required, completedCount: s.witness.completed },
      create: {
        id: `${scheme.id}-witness-cycle`,
        schemeId: scheme.id,
        requiredCount: s.witness.required,
        completedCount: s.witness.completed,
        cycleStart: new Date('2026-01-01'),
        cycleEnd: new Date('2026-12-31'),
      },
    });

    await prisma.assessment.upsert({
      where: { id: `${scheme.id}-next-assessment` },
      update: { scheduledDate: new Date(s.nextAssessment.date) },
      create: {
        id: `${scheme.id}-next-assessment`,
        schemeId: scheme.id,
        assessmentType: s.nextAssessment.type,
        source: 'ABAssessment',
        scheduledDate: new Date(s.nextAssessment.date),
      },
    });

    for (const f of s.criticalFindings) {
      await prisma.finding.upsert({
        where: { findingCode: f.code },
        update: {},
        create: {
          findingCode: f.code,
          requirementId: f.requirementId,
          schemeId: scheme.id,
          source: 'Internal Audit',
          classification: 'MajorNC',
          status: 'Open',
        },
      });
    }
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
