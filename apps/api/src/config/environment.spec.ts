import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment';
describe('environment validation', () => {
  it('allows a minimal development environment', () => expect(validateEnvironment({ NODE_ENV: 'development' })).toBeTruthy());
  it('fails closed when production secrets are missing', () => expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/));
  it('rejects a weak production JWT secret', () => expect(() => validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://db', JWT_SECRET: 'short', SMTP_HOST: 'smtp', SMTP_USER: 'user', SMTP_PASSWORD: 'pass', EMAIL_FROM: 'mail@example.org', S3_ENDPOINT: 'https://s3.example.org', S3_REGION: 'auto', S3_BUCKET: 'files', S3_ACCESS_KEY: 'key', S3_SECRET_KEY: 'secret' })).toThrow(/32/));
});
