export interface TierLimits {
  maxActiveEvents: number; maxParticipantsPerEvent: number; photoStorageLimitBytes: bigint; fileStorageLimitBytes: bigint;
  maxPhotosPerEvent: number; defaultMaxPhotosPerParticipant: number; emailMultiplier: number; allowedFileTypes: string[]; featureFlags: Record<string, boolean>;
}
export type TierLimitOverrides = Partial<{ [K in keyof TierLimits]: TierLimits[K] }>;
export function resolveTierLimits(base: TierLimits, overrides?: TierLimitOverrides | null): TierLimits { return { ...base, ...(overrides ?? {}) }; }
export function monthlyEmailLimit(participantCount: number, multiplier: number): number { if (participantCount < 0 || multiplier < 0) throw new Error('Sayaç ve çarpan negatif olamaz.'); return participantCount * multiplier; }
export function assertWithinQuota(usage: bigint, requested: bigint, limit: bigint): boolean { if (usage < 0n || requested < 0n || limit < 0n) throw new Error('Kota değerleri negatif olamaz.'); return usage + requested <= limit; }
