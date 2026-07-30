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

  it('prevents simultaneous duplicate organizations and lets the other user request access', async () => {
    const register = async (email: string) => (await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, firstName: 'Ekip', lastName: 'Üyesi', password: 'SecurePassword1' })
      .expect(201)).body.accessToken as string;
    const adminToken = await register('duplicate-admin@example.org');
    const memberToken = await register('duplicate-member@example.org');
    const create = (token: string, slug: string) => request(app.getHttpServer())
      .post('/api/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  İyilik   Derneği ', slug, contactEmail: `${slug}@example.org` });

    const attempts = await Promise.all([
      create(adminToken, 'iyilik-dernegi-a'),
      create(memberToken, 'iyilik-dernegi-b'),
    ]);
    expect(attempts.map(item => item.status).sort()).toEqual([201, 409]);

    const created = attempts.find(item => item.status === 201)!;
    const duplicate = attempts.find(item => item.status === 409)!;
    expect(duplicate.body).toMatchObject({
      code: 'ORGANIZATION_EXISTS',
      organization: { id: created.body.id, name: 'İyilik   Derneği' },
    });
    expect(await prisma.organization.count({ where: { normalizedName: 'iyilik dernegi' } })).toBe(1);

    const requesterToken = duplicate === attempts[0] ? adminToken : memberToken;
    const organizationAdminToken = created === attempts[0] ? adminToken : memberToken;
    const joinRequest = (await request(app.getHttpServer())
      .post(`/api/organizations/${created.body.id}/join-requests`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({})
      .expect(201)).body;

    const pending = (await request(app.getHttpServer())
      .get(`/api/organizations/${created.body.id}/join-requests`)
      .set('Authorization', `Bearer ${organizationAdminToken}`)
      .expect(200)).body;
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(joinRequest.id);

    const review = (await request(app.getHttpServer())
      .patch(`/api/organizations/${created.body.id}/join-requests/${joinRequest.id}`)
      .set('Authorization', `Bearer ${organizationAdminToken}`)
      .send({ approved: true })
      .expect(200)).body;
    expect(review).toMatchObject({ approved: true, membership: { role: 'EVENT_MANAGER' } });
    expect(await prisma.organizationMembership.count({ where: { organizationId: created.body.id } })).toBe(2);
  });

  it('supports multiple organization admins and email invitations without leaving an organization adminless', async () => {
    const register = async (email: string) => (await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, firstName: 'Yönetici', lastName: 'Test', password: 'SecurePassword1' })
      .expect(201)).body.accessToken as string;
    const firstAdmin = await register('team-admin-one@example.org');
    const secondAdmin = await register('team-admin-two@example.org');
    const organization = (await request(app.getHttpServer())
      .post('/api/organizations')
      .set('Authorization', `Bearer ${firstAdmin}`)
      .send({ name: 'Çok Yöneticili Kurum', slug: 'cok-yoneticili-kurum', contactEmail: 'team@example.org' })
      .expect(201)).body;

    const added = (await request(app.getHttpServer())
      .post(`/api/organizations/${organization.id}/members`)
      .set('Authorization', `Bearer ${firstAdmin}`)
      .send({ email: 'team-admin-two@example.org', role: 'ORGANIZATION_ADMIN' })
      .expect(201)).body;
    expect(added).toMatchObject({ kind: 'member', membership: { role: 'ORGANIZATION_ADMIN' } });
    await request(app.getHttpServer())
      .post('/api/legal/accept-organization-terms')
      .set('Authorization', `Bearer ${secondAdmin}`)
      .send({ organizationId: organization.id, version: '1.0', representativeRole: 'Kurum yöneticisi', authorityDeclared: true })
      .expect(201);

    const firstMembership = await prisma.organizationMembership.findFirstOrThrow({
      where: { organizationId: organization.id, user: { email: 'team-admin-one@example.org' } },
    });
    await request(app.getHttpServer())
      .patch(`/api/organizations/${organization.id}/members/${firstMembership.id}`)
      .set('Authorization', `Bearer ${secondAdmin}`)
      .send({ role: 'EVENT_MANAGER' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/organizations/${organization.id}/members/${added.membership.id}`)
      .set('Authorization', `Bearer ${secondAdmin}`)
      .send({ role: 'EVENT_MANAGER' })
      .expect(409);

    const invited = (await request(app.getHttpServer())
      .post(`/api/organizations/${organization.id}/members`)
      .set('Authorization', `Bearer ${secondAdmin}`)
      .send({ email: 'new-team-member@example.org', role: 'FIELD_STAFF' })
      .expect(201)).body;
    expect(invited).toMatchObject({ kind: 'invitation', invitation: { role: 'FIELD_STAFF' } });
    expect((await request(app.getHttpServer())
      .get(`/api/organizations/${organization.id}/invitations`)
      .set('Authorization', `Bearer ${secondAdmin}`)
      .expect(200)).body).toHaveLength(1);

    const email = await prisma.emailMessage.findFirstOrThrow({
      where: { recipient: 'new-team-member@example.org', subject: { contains: 'ekibine davet' } },
      orderBy: { createdAt: 'desc' },
    });
    const token = decodeURIComponent(email.body.match(/token=([^"&<]+)/)![1]);
    const completed = (await request(app.getHttpServer())
      .post('/api/auth/account-setup/complete')
      .send({ token, password: 'NewSecurePassword1' })
      .expect(201)).body;
    expect(completed.organizationMembershipsCreated).toBe(1);
    expect(await prisma.organizationMembership.count({
      where: { organizationId: organization.id, role: 'FIELD_STAFF', user: { email: 'new-team-member@example.org' } },
    })).toBe(1);
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
