import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ExternalIntegrationUnavailableFilter } from '../src/interface/common/external-integration-unavailable.filter';

/**
 * End-to-end auth + RBAC verification against a real running app instance
 * and the real dev database (same convention AIHCM documents in its own
 * ADR 0007 for local-Postgres integration tests — no mocking of Prisma).
 * Requires: the dedicated NexAccred Postgres cluster running and seeded
 * (see nexaccred-api/README.md §1-2 — `npx prisma migrate dev` then
 * `npx ts-node prisma/seed.ts`).
 */
describe('Auth + RBAC (e2e)', () => {
  let app: INestApplication;
  const DEMO_PASSWORD = 'NexAccred123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new ExternalIntegrationUnavailableFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function loginAs(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: DEMO_PASSWORD })
      .expect(201);
    return res.body.accessToken;
  }

  describe('POST /auth/login', () => {
    it('rejects an unknown email with 401, not a distinguishing error', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@nexaccred.io', password: DEMO_PASSWORD })
        .expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects a correct email with the wrong password, with the same message', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'joan.marsh@nexaccred.io', password: 'wrong' })
        .expect(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects a malformed body with 400 and per-field validation messages', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);
      expect(res.body.message).toEqual(expect.arrayContaining([expect.stringContaining('email')]));
    });

    it('issues a token embedding the role\'s permissions for a valid login', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'joan.marsh@nexaccred.io', password: DEMO_PASSWORD })
        .expect(201);
      expect(res.body.user.roleName).toBe('Head of Accreditation');
      expect(res.body.accessToken).toEqual(expect.any(String));
    });
  });

  describe('Bearer token handling', () => {
    it('rejects a request with no Authorization header (401)', async () => {
      await request(app.getHttpServer()).get('/schemes').expect(401);
    });

    it('rejects a malformed/garbage token (401)', async () => {
      await request(app.getHttpServer())
        .get('/schemes')
        .set('Authorization', 'Bearer garbage.not.a.jwt')
        .expect(401);
    });
  });

  describe('RBAC — Requirements domain (Schemes, Readiness, Operations)', () => {
    it('Head of Accreditation (Requirements: Edit) can read /schemes', async () => {
      const token = await loginAs('joan.marsh@nexaccred.io');
      await request(app.getHttpServer())
        .get('/schemes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('Accreditation Staff (Requirements: Edit) can read /schemes', async () => {
      const token = await loginAs('rahayu.ningsih@nexaccred.io');
      await request(app.getHttpServer())
        .get('/schemes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('Impartiality Committee (Requirements: NoAccess) is forbidden from /schemes', async () => {
      const token = await loginAs('k.devi@nexaccred.io');
      const res = await request(app.getHttpServer())
        .get('/schemes')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      expect(res.body.message).toMatch(/NoAccess on Requirements/);
    });

    it('System Administrator (Requirements: NoAccess) is forbidden from /schemes — the FR-11.5 boundary', async () => {
      const token = await loginAs('r.alvi@nexaccred.io');
      await request(app.getHttpServer())
        .get('/schemes')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('RBAC — Administration domain (integration sync status)', () => {
    it('System Administrator (Administration: Approve) can read sync status', async () => {
      const token = await loginAs('r.alvi@nexaccred.io');
      await request(app.getHttpServer())
        .get('/integrations/sync-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('Accreditation Staff (Administration: NoAccess) is forbidden from sync status', async () => {
      const token = await loginAs('rahayu.ningsih@nexaccred.io');
      await request(app.getHttpServer())
        .get('/integrations/sync-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('RBAC — Personnel domain', () => {
    it('Internal Auditor (Personnel: NoAccess) is forbidden from /personnel/:ref', async () => {
      const token = await loginAs('m.santos@nexaccred.io');
      await request(app.getHttpServer())
        .get('/personnel/some-employee-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('Head of Accreditation (Personnel: Edit) passes the RBAC gate, then gets a 503 because AIHCM is unreachable in this test run — proves the gate runs before the integration call, not instead of it', async () => {
      const token = await loginAs('joan.marsh@nexaccred.io');
      const res = await request(app.getHttpServer())
        .get('/personnel/some-employee-id')
        .set('Authorization', `Bearer ${token}`);
      // Accept either outcome: 503 if AIHCM isn't running in this test
      // environment, 200/404 if it happens to be. What must NOT happen is 403.
      expect(res.status).not.toBe(403);
      if (res.status === 503) {
        expect(res.body.system).toBe('AIHCM');
      }
    });
  });
});
