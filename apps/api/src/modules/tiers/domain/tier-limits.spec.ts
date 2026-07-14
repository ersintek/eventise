import { describe, expect, it } from 'vitest';
import { assertWithinQuota, monthlyEmailLimit, resolveTierLimits, TierLimits } from './tier-limits';

const tier: TierLimits = { maxActiveEvents: 20, maxParticipantsPerEvent: 500, photoStorageLimitBytes: 1_073_741_824n, fileStorageLimitBytes: 1_073_741_824n, maxPhotosPerEvent: 50, defaultMaxPhotosPerParticipant: 5, emailMultiplier: 3, allowedFileTypes: ['PDF'], featureFlags: { checkIn: true } };
describe('tier limits', () => {
  it('applies a scoped override without changing the base tier', () => { expect(resolveTierLimits(tier, { maxActiveEvents: 30 }).maxActiveEvents).toBe(30); expect(tier.maxActiveEvents).toBe(20); });
  it('calculates the monthly email allowance', () => expect(monthlyEmailLimit(328, 3)).toBe(984));
  it('accepts the exact boundary and rejects overflow', () => { expect(assertWithinQuota(900n, 100n, 1000n)).toBe(true); expect(assertWithinQuota(901n, 100n, 1000n)).toBe(false); });
  it('rejects negative values', () => expect(() => monthlyEmailLimit(-1, 3)).toThrow());
});
