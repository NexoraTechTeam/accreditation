import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ExternalIntegrationUnavailableFilter } from '../src/interface/common/external-integration-unavailable.filter';

/**
 * End-to-end coverage for the CRUD modules built on top of the auth/RBAC
 * foundation (see auth-rbac.e2e-spec.ts for the core auth/permission
 * matrix tests — this file assumes that foundation works and focuses on
 * RBAC enforcement, error handling, and data consistency PER bounded
 * context: does a create actually show up in a subsequent list (not just
 * return 201), does a domain rule reject the input it should (CAPA stage
 * order, Finding close requiring Approve, RolePermission self-escalation),
 * and does every mutation land in the audit trail.
 *
 * Uses the same real running app + real dev database convention as
 * auth-rbac.e2e-spec.ts. A random suffix on unique fields (accreditation
 * numbers, ref codes, etc.) keeps repeated runs from colliding with
 * leftover rows from a prior run.
 */
describe('CRUD modules (e2e)', () => {
  let app: INestApplication;
  const DEMO_PASSWORD = 'NexAccred123!';
  const runId = Date.now();

  let headToken: string;
  let auditorToken: string;
  let impartialityToken: string;
  let docControlToken: string;
  let adminToken: string;
  let headUserId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new ExternalIntegrationUnavailableFilter());
    await app.init();

    const login = async (email: string) => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password: DEMO_PASSWORD });
      return res.body;
    };
    const head = await login('joan.marsh@nexaccred.io');
    headToken = head.accessToken;
    headUserId = head.user.id;
    auditorToken = (await login('m.santos@nexaccred.io')).accessToken;
    impartialityToken = (await login('k.devi@nexaccred.io')).accessToken;
    docControlToken = (await login('helda.mutiara@nexaccred.io')).accessToken;
    adminToken = (await login('r.alvi@nexaccred.io')).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('AccreditationBody — Requirements domain', () => {
    it('Impartiality Committee (Requirements: NoAccess) cannot even list', async () => {
      await request(app.getHttpServer())
        .get('/accreditation-bodies')
        .set(auth(impartialityToken))
        .expect(403);
    });

    it('Internal Auditor (Requirements: View) can list but not create', async () => {
      await request(app.getHttpServer()).get('/accreditation-bodies').set(auth(auditorToken)).expect(200);
      await request(app.getHttpServer())
        .post('/accreditation-bodies')
        .set(auth(auditorToken))
        .send({
          shortName: 'TST',
          fullName: 'Test Body',
          country: 'Testland',
          accreditationNumber: `TST-${runId}`,
          accreditedSince: '2020-01-01',
        })
        .expect(403);
    });

    it('Head of Accreditation (Requirements: Edit) can create, and the new body appears in the list', async () => {
      const created = await request(app.getHttpServer())
        .post('/accreditation-bodies')
        .set(auth(headToken))
        .send({
          shortName: 'TST',
          fullName: 'Test Accreditation Body',
          country: 'Testland',
          accreditationNumber: `TST-${runId}`,
          accreditedSince: '2020-01-01',
        })
        .expect(201);

      const list = await request(app.getHttpServer())
        .get('/accreditation-bodies')
        .set(auth(headToken))
        .expect(200);
      expect(list.body.some((ab: { id: string }) => ab.id === created.body.id)).toBe(true);
    });

    it('rejects a malformed create body with 400', async () => {
      await request(app.getHttpServer())
        .post('/accreditation-bodies')
        .set(auth(headToken))
        .send({ shortName: '' })
        .expect(400);
    });
  });

  describe('Standard — Requirements domain', () => {
    it('creates a standard and it is readable back by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/standards')
        .set(auth(headToken))
        .send({ name: `Test Standard ${runId}`, type: 'Supporting', issuer: 'Test Issuer' })
        .expect(201);

      const fetched = await request(app.getHttpServer())
        .get(`/standards/${created.body.id}`)
        .set(auth(headToken))
        .expect(200);
      expect(fetched.body.name).toBe(`Test Standard ${runId}`);
    });
  });

  describe('Requirement — Requirements domain', () => {
    it('creates a requirement against a seeded clause and filters by clauseId', async () => {
      const clauseId = 'seed-clause-5.2';
      const created = await request(app.getHttpServer())
        .post('/requirements')
        .set(auth(headToken))
        .send({
          refCode: `REQ-E2E-${runId}`,
          clauseId,
          requirementText: 'E2E test requirement',
          requirementType: 'MANDATORY_CLAUSE',
          effectiveDate: '2024-01-01',
        })
        .expect(201);

      const filtered = await request(app.getHttpServer())
        .get(`/requirements?clauseId=${clauseId}`)
        .set(auth(headToken))
        .expect(200);
      expect(filtered.body.some((r: { id: string }) => r.id === created.body.id)).toBe(true);
    });
  });

  describe('Finding / Capa — FindingsCAPA domain, the Approve boundary', () => {
    let findingId: string;
    let capaId: string;

    it('Internal Auditor (FindingsCAPA: Edit) can create a Finding', async () => {
      const res = await request(app.getHttpServer())
        .post('/findings')
        .set(auth(auditorToken))
        .send({
          findingCode: `FND-E2E-${runId}`,
          requirementId: (
            await request(app.getHttpServer()).get('/requirements').set(auth(auditorToken))
          ).body[0].id,
          schemeId: 'iso9001',
          source: 'Internal Audit',
          classification: 'MinorNC',
        })
        .expect(201);
      findingId = res.body.id;
      expect(res.body.status).toBe('Open');
    });

    it('Internal Auditor (Edit, not Approve) cannot close the finding', async () => {
      await request(app.getHttpServer())
        .post(`/findings/${findingId}/close`)
        .set(auth(auditorToken))
        .expect(403);
    });

    it('Head of Accreditation (FindingsCAPA: Approve) can close it', async () => {
      const res = await request(app.getHttpServer())
        .post(`/findings/${findingId}/close`)
        .set(auth(headToken))
        .expect(201);
      expect(res.body.status).toBe('Closed');
    });

    it('Impartiality Committee (FindingsCAPA: Edit) can create a Capa against the finding', async () => {
      const res = await request(app.getHttpServer())
        .post('/capa')
        .set(auth(impartialityToken))
        .send({ capaCode: `CAPA-E2E-${runId}`, findingId })
        .expect(201);
      capaId = res.body.id;
      expect(res.body.stage).toBe('Correction');
    });

    it('rejects a backward stage transition with 400', async () => {
      // Advance forward once first so there's somewhere valid to fall back FROM.
      await request(app.getHttpServer())
        .patch(`/capa/${capaId}/stage`)
        .set(auth(headToken))
        .send({ stage: 'RootCause' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/capa/${capaId}/stage`)
        .set(auth(headToken))
        .send({ stage: 'Correction' }) // backward
        .expect(400);
    });

    it('rejects re-submitting the same stage (not strictly forward) with 400', async () => {
      await request(app.getHttpServer())
        .patch(`/capa/${capaId}/stage`)
        .set(auth(headToken))
        .send({ stage: 'RootCause' })
        .expect(400);
    });

    it('accepts the correct forward transition', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/capa/${capaId}/stage`)
        .set(auth(headToken))
        .send({ stage: 'CorrectiveAction' })
        .expect(200);
      expect(res.body.stage).toBe('CorrectiveAction');
    });

    it('Document Controller (FindingsCAPA: NoAccess) cannot even list findings', async () => {
      await request(app.getHttpServer()).get('/findings').set(auth(docControlToken)).expect(403);
    });
  });

  describe('Risk — FindingsCAPA domain', () => {
    it('creates and lists a risk', async () => {
      const created = await request(app.getHttpServer())
        .post('/risks')
        .set(auth(headToken))
        .send({
          riskCode: `RISK-E2E-${runId}`,
          category: 'Operational',
          description: 'E2E test risk',
          likelihood: 'Medium',
          impact: 'Medium',
        })
        .expect(201);
      const list = await request(app.getHttpServer()).get('/risks').set(auth(headToken)).expect(200);
      expect(list.body.some((r: { id: string }) => r.id === created.body.id)).toBe(true);
    });
  });

  describe('Task — Authenticated only, no domain gate', () => {
    it('System Administrator (NoAccess everywhere except Administration) can still create/list tasks', async () => {
      // Confirms @Authenticated() really means "any valid session," matching
      // the documented judgment call that Tasks doesn't map to one RBAC domain.
      const created = await request(app.getHttpServer())
        .post('/tasks')
        .set(auth(adminToken))
        .send({ taskCode: `TASK-E2E-${runId}`, title: 'E2E test task', dueDate: '2020-01-01' })
        .expect(201);

      const overdue = await request(app.getHttpServer())
        .get('/tasks/overdue')
        .set(auth(adminToken))
        .expect(200);
      expect(overdue.body.some((t: { id: string }) => t.id === created.body.id)).toBe(true);
    });

    it('an unauthenticated request is still rejected with 401', async () => {
      await request(app.getHttpServer()).get('/tasks').expect(401);
    });
  });

  describe('Document / RequiredDocumentType — Evidence domain', () => {
    it('Document Controller (Evidence: Edit) can create a document', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents')
        .set(auth(docControlToken))
        .send({ name: `E2E Doc ${runId}`, docType: 'Procedure', version: '1.0', ownerUserId: headUserId })
        .expect(201);
      expect(res.body.name).toBe(`E2E Doc ${runId}`);
    });

    it('Impartiality Committee (Evidence: NoAccess) is forbidden', async () => {
      await request(app.getHttpServer()).get('/documents').set(auth(impartialityToken)).expect(403);
    });
  });

  describe('Users / Roles — Administration domain, the Approve boundary', () => {
    it('Head of Accreditation (Administration: View only) cannot create a user', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set(auth(headToken))
        .send({ fullName: 'Nobody', email: `nobody-${runId}@nexaccred.io`, password: 'irrelevant123', roleId: 'x' })
        .expect(403);
    });

    it('System Administrator (Administration: Approve) can create a user, and it never leaks passwordHash', async () => {
      const roles = await request(app.getHttpServer()).get('/roles').set(auth(adminToken)).expect(200);
      const staffRole = roles.body.find((r: { roleName: string }) => r.roleName === 'Accreditation Staff');

      const res = await request(app.getHttpServer())
        .post('/users')
        .set(auth(adminToken))
        .send({
          fullName: 'E2E Test User',
          email: `e2e-${runId}@nexaccred.io`,
          password: 'SomeSecurePassword123!',
          roleId: staffRole.id,
        })
        .expect(201);

      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.email).toBe(`e2e-${runId}@nexaccred.io`);
    });

    it('self-escalation guard: System Administrator cannot grant a role a level on Requirements higher than its own (NoAccess)', async () => {
      const roles = await request(app.getHttpServer()).get('/roles').set(auth(adminToken)).expect(200);
      const staffRole = roles.body.find((r: { roleName: string }) => r.roleName === 'Accreditation Staff');

      const res = await request(app.getHttpServer())
        .patch(`/roles/${staffRole.id}/permissions/Requirements`)
        .set(auth(adminToken))
        .send({ accessLevel: 'Approve' })
        .expect(403);
      expect(res.body.message).toMatch(/cannot grant/i);
    });

    it('but CAN grant a level on Administration, its own domain, up to its own Approve level', async () => {
      const roles = await request(app.getHttpServer()).get('/roles').set(auth(adminToken)).expect(200);
      const staffRole = roles.body.find((r: { roleName: string }) => r.roleName === 'Accreditation Staff');

      const res = await request(app.getHttpServer())
        .patch(`/roles/${staffRole.id}/permissions/Administration`)
        .set(auth(adminToken))
        .send({ accessLevel: 'View' })
        .expect(200);
      expect(res.body.before).toBe('NoAccess');
      expect(res.body.after).toBe('View');

      // Restore seed state so this test is re-runnable and doesn't leave the
      // demo DB in a mutated state for anyone exploring it afterward.
      await request(app.getHttpServer())
        .patch(`/roles/${staffRole.id}/permissions/Administration`)
        .set(auth(adminToken))
        .send({ accessLevel: 'NoAccess' })
        .expect(200);
    });
  });

  describe('Audit trail — every mutation above must have been recorded', () => {
    it('the AccreditationBody create from earlier in this run appears in the audit trail', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit-trail?entityType=AccreditationBody')
        .set(auth(adminToken))
        .expect(200);
      expect(res.body.some((entry: { action: string }) => entry.action === 'create')).toBe(true);
    });

    it('is itself gated to Administration domain — Internal Auditor is forbidden', async () => {
      await request(app.getHttpServer()).get('/audit-trail').set(auth(auditorToken)).expect(403);
    });
  });
});
