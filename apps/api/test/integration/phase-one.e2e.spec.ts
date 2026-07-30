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
    await request(app.getHttpServer()).post('/api/legal/accept-user-terms').set('Authorization', `Bearer ${userA.accessToken}`).send({ version: '1.0' }).expect(201);
    await request(app.getHttpServer()).post('/api/legal/accept-user-terms').set('Authorization', `Bearer ${userB.accessToken}`).send({ version: '1.0' }).expect(201);
    const legal = { organizationType: 'DERNEK', representativeRole: 'Koordinatör', authorityDeclared: true, organizationTermsAccepted: true, organizationTermsVersion: '1.0' };
    const orgA = (await request(app.getHttpServer()).post('/api/organizations').set('Authorization', `Bearer ${userA.accessToken}`).send({ name: 'Kurum A', slug: 'kurum-a', contactEmail: 'a@example.org', ...legal }).expect(201)).body as { id: string };
    const orgB = (await request(app.getHttpServer()).post('/api/organizations').set('Authorization', `Bearer ${userB.accessToken}`).send({ name: 'Kurum B', slug: 'kurum-b', contactEmail: 'b@example.org', ...legal }).expect(201)).body as { id: string };
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

  it('creates the default form atomically and rejects duplicate event slugs', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'event-builder@example.org', firstName: 'Event', lastName: 'Builder', password: 'SecurePassword1' })
      .expect(201);
    const token = registration.body.accessToken as string;
    const organization = await request(app.getHttpServer())
      .post('/api/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Event Builder', slug: 'event-builder', contactEmail: 'events@example.org' })
      .expect(201);
    const organizationId = organization.body.id as string;
    const before = await prisma.form.count({ where: { organizationId } });
    const event = {
      title: 'İlk Etkinlik',
      slug: 'ilk-etkinlik',
      startsAt: '2027-10-01T09:00:00.000Z',
      endsAt: '2027-10-01T12:00:00.000Z',
      capacity: 1,
      faqs: [],
    };

    const createdEvent = await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send(event)
      .expect(201);
    expect(await prisma.form.count({ where: { organizationId } })).toBe(before + 1);

    await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...event, title: 'Aynı Bağlantı' })
      .expect(409);
    expect(await prisma.form.count({ where: { organizationId } })).toBe(before + 1);

    await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...event, slug: 'Geçersiz Kısa Ad' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/organizations/${organizationId}/events/${createdEvent.body.id}/state`)
      .set('Authorization', `Bearer ${token}`)
      .send({ publicationStatus: 'PUBLISHED', registrationStatus: 'OPEN' })
      .expect(200);
    const submit = (email: string) => request(app.getHttpServer())
      .post('/api/public/events/event-builder/ilk-etkinlik/registrations')
      .send({ email, firstName: 'Test', lastName: 'Katılımcı', answers: {}, consentVersionIds: [], createAccount: false });
    const simultaneous = await Promise.all([submit('capacity-one@example.org'), submit('capacity-two@example.org')]);
    expect(simultaneous.map(response => response.status)).toEqual([201, 201]);
    expect(simultaneous.map(response => response.body.status).sort()).toEqual(['ACCEPTED', 'WAITLISTED']);

    await submit('capacity-one@example.org').expect(409);
    expect(await prisma.eventRegistration.count({ where: { eventId: createdEvent.body.id } })).toBe(2);
  });
});
