import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment';
describe('environment validation', () => {
  it('allows a minimal development environment', () => expect(validateEnvironment({ NODE_ENV: 'development' })).toBeTruthy());
  it('fails closed when production secrets are missing', () => expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/));
  it('rejects a weak production JWT secret', () => expect(() => validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://db', JWT_SECRET: 'short', SMTP_HOST: 'smtp', SMTP_USER: 'user', SMTP_PASSWORD: 'pass', EMAIL_FROM: 'mail@example.org', S3_ENDPOINT: 'https://s3.example.org', S3_REGION: 'auto', S3_BUCKET: 'files', S3_ACCESS_KEY: 'key', S3_SECRET_KEY: 'secret', WEB_ORIGIN: 'https://eventise.example.org', PUBLIC_APP_URL: 'https://eventise.example.org' })).toThrow(/32/));
  it('requires HTTPS origins in production', () => expect(() => validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://db', JWT_SECRET: 'a'.repeat(32), SMTP_HOST: 'smtp', SMTP_USER: 'user', SMTP_PASSWORD: 'pass', EMAIL_FROM: 'mail@example.org', S3_ENDPOINT: 'https://s3.example.org', S3_REGION: 'auto', S3_BUCKET: 'files', S3_ACCESS_KEY: 'key', S3_SECRET_KEY: 'secret', WEB_ORIGIN: 'http://eventise.example.org', PUBLIC_APP_URL: 'http://eventise.example.org' })).toThrow(/HTTPS/));
});
