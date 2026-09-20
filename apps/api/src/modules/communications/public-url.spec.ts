import { describe, expect, it } from 'vitest';
import { toPublicUrl } from './public-url';

describe('toPublicUrl', () => {
  it('uses the configured public domain and normalizes slashes', () => {
    expect(toPublicUrl('/events/acme/summit', 'https://eventise.sici.dev/')).toBe('https://eventise.sici.dev/events/acme/summit');
  });

  it('uses the production Eventise domain when no base is configured', () => {
    expect(toPublicUrl('/events/acme/summit', '')).toBe('https://eventise.sici.dev/events/acme/summit');
  });
});
