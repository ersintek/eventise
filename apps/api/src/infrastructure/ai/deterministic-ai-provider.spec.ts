import { describe, expect, it } from 'vitest';
import { DeterministicAiProvider } from './deterministic-ai-provider';

describe('DeterministicAiProvider', () => {
  it('extracts date, time, venue, address and capacity from a Turkish announcement', async () => {
    const provider = new DeterministicAiProvider();
    const draft = await provider.extractEvent('Dayanışma Atölyesi\nTarih: 20 Haziran 2027\nSaat: 10:30 - 16:00\nMekân: Kent Merkezi\nAdres: Çankaya, Ankara\nKontenjan: 40');
    expect(draft).toMatchObject({ title: 'Dayanışma Atölyesi', venueName: 'Kent Merkezi', venueAddress: 'Çankaya, Ankara', capacity: 40, format: 'OFFLINE' });
    expect(draft.startsAt).toContain('2027-06-20T07:30');
    expect(draft.endsAt).toContain('2027-06-20T13:00');
  });

  it('detects online and hybrid announcements with a participation link', async () => {
    const provider = new DeterministicAiProvider();
    const online = await provider.extractEvent('Çevrim içi buluşma\n12.09.2027\nSaat: 19:00-21:00\nhttps://meet.google.com/example');
    const hybrid = await provider.extractEvent('Hibrit Forum\n12.09.2027\nMekân: Salon\nBağlantı: https://example.org/live');
    expect(online).toMatchObject({ format: 'ONLINE', onlineLink: 'https://meet.google.com/example' });
    expect(hybrid).toMatchObject({ format: 'HYBRID', onlineLink: 'https://example.org/live' });
  });
});
