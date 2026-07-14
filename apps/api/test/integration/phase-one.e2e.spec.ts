import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it, inject } from 'vitest';
import { AppModule } from '../../dist/app.module';

describe('Phase 1 identity, organization and tenant isolation', () => {
  let app: INestApplication, prisma: PrismaClient;
  beforeAll(async () => {
    process.env.DATABASE_URL = inject('databaseUrl');
    process.env.JWT_SECRET = 'integration-test-secret-at-least-32-characters';
    prisma = new PrismaClient();
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => { await app.close(); await prisma.$disconnect(); });

  it('exposes a public health endpoint', async () => { await request(app.getHttpServer()).get('/api/health').expect(200, { status: 'ok' }); });

  it('registers users, creates scoped organizations, and hides cross-tenant data', async () => {
    const register = (email: string, firstName: string) => request(app.getHttpServer()).post('/api/auth/register').send({ email, firstName, lastName: 'Test', password: 'SecurePassword1' }).expect(201);
    const userA = (await register('tenant-a@example.org', 'TenantA')).body as { accessToken: string };
    const userB = (await register('tenant-b@example.org', 'TenantB')).body as { accessToken: string };
    const orgA = (await request(app.getHttpServer()).post('/api/organizations').set('Authorization', `Bearer ${userA.accessToken}`).send({ name: 'Kurum A', slug: 'kurum-a', contactEmail: 'a@example.org' }).expect(201)).body as { id: string };
    const orgB = (await request(app.getHttpServer()).post('/api/organizations').set('Authorization', `Bearer ${userB.accessToken}`).send({ name: 'Kurum B', slug: 'kurum-b', contactEmail: 'b@example.org' }).expect(201)).body as { id: string };
    await request(app.getHttpServer()).get(`/api/organizations/${orgA.id}`).set('Authorization', `Bearer ${userA.accessToken}`).expect(200);
    await request(app.getHttpServer()).get(`/api/organizations/${orgB.id}`).set('Authorization', `Bearer ${userA.accessToken}`).expect(404);
    const organizations = (await request(app.getHttpServer()).get('/api/organizations').set('Authorization', `Bearer ${userA.accessToken}`).expect(200)).body as Array<{ id: string }>;
    expect(organizations.map(item => item.id)).toEqual([orgA.id]);
    expect(await prisma.auditLog.count({ where: { actorId: { not: null } } })).toBeGreaterThanOrEqual(4);
  });

  it('rejects unauthenticated and malformed requests without persisting them', async () => {
    await request(app.getHttpServer()).get('/api/organizations').expect(401);
    await request(app.getHttpServer()).post('/api/auth/register').send({ email: 'bad', firstName: 'A', lastName: 'B', password: 'short' }).expect(400);
    expect(await prisma.user.count({ where: { email: 'bad' } })).toBe(0);
  });
});
