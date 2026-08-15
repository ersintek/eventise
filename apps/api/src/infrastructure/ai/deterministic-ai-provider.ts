import { Injectable } from '@nestjs/common';
import { AiProvider, EventDraft } from './ai-provider.port';

const months: Record<string, number> = {
  ocak: 0, subat: 1, şubat: 1, mart: 2, nisan: 3, mayis: 4, mayıs: 4, haziran: 5,
  temmuz: 6, agustos: 7, ağustos: 7, eylul: 8, eylül: 8, ekim: 9, kasim: 10, kasım: 10, aralik: 11, aralık: 11,
};

function istanbulIso(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour - 3, minute)).toISOString();
}

function extractDate(text: string) {
  const numeric = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (numeric) return { day: Number(numeric[1]), month: Number(numeric[2]) - 1, year: Number(numeric[3]), confidence: .9 };
  const named = text.toLocaleLowerCase('tr-TR').match(/\b(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(20\d{2})\b/);
  if (named) return { day: Number(named[1]), month: months[named[2]], year: Number(named[3]), confidence: .9 };
  return null;
}

function extractTimes(text: string) {
  const range = text.match(/(?:saat\s*[:=-]?\s*)?(\d{1,2})[:.](\d{2})\s*(?:-|–|—|ile)\s*(\d{1,2})[:.](\d{2})/i);
  if (range) return { startHour: Number(range[1]), startMinute: Number(range[2]), endHour: Number(range[3]), endMinute: Number(range[4]), confidence: .92 };
  const single = text.match(/(?:saat|başlangıç)\s*[:=-]?\s*(\d{1,2})[:.](\d{2})/i);
  if (single) return { startHour: Number(single[1]), startMinute: Number(single[2]), endHour: Number(single[1]) + 2, endMinute: Number(single[2]), confidence: .72 };
  return { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0, confidence: .35 };
}

@Injectable()
export class DeterministicAiProvider implements AiProvider {
  async extractEvent(text: string) {
    const lines = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const date = extractDate(text);
    const times = extractTimes(text);
    const capacity = text.match(/(?:kontenjan|kapasite)\s*[:=-]?\s*(\d+)/i);
    const venue = text.match(/(?:mek[aâ]n|yer)\s*[:=-]\s*([^\n]+)/i);
    const address = text.match(/adres\s*[:=-]\s*([^\n]+)/i);
    const url = text.match(/https?:\/\/[^\s<>)]+/i)?.[0]?.replace(/[.,;]$/, '');
    const lower = text.toLocaleLowerCase('tr-TR');
    const format: EventDraft['format'] = /hibrit|hybrid/.test(lower) ? 'HYBRID' : /çevrim\s*içi|cevrim\s*ici|online|zoom|google meet|teams/.test(lower) ? 'ONLINE' : 'OFFLINE';
    const title = lines.find(line => !/^(tarih|saat|yer|mek[aâ]n|adres|kontenjan|kapasite|bağlantı|link)\s*[:=-]/i.test(line))?.slice(0, 160);
    const summaryLine = lines.find(line => line !== title && !/^(tarih|saat|yer|mek[aâ]n|adres|kontenjan|kapasite|bağlantı|link)\s*[:=-]/i.test(line));
    const draft: EventDraft = {
      title,
      summary: summaryLine?.slice(0, 300),
      description: text.slice(0, 5000),
      capacity: capacity ? Number(capacity[1]) : undefined,
      venueName: venue?.[1]?.trim(),
      venueAddress: address?.[1]?.trim(),
      onlineLink: format !== 'OFFLINE' ? url : undefined,
      format,
      confidence: {
        title: title ? .78 : 0,
        summary: summaryLine ? .6 : 0,
        startsAt: date ? Math.min(date.confidence, times.confidence) : 0,
        endsAt: date ? Math.min(date.confidence, times.confidence) : 0,
        capacity: capacity ? .92 : 0,
        venueName: venue ? .86 : 0,
        venueAddress: address ? .88 : 0,
        onlineLink: url && format !== 'OFFLINE' ? .9 : 0,
        format: format === 'OFFLINE' && !venue ? .55 : .86,
      },
    };
    if (date) {
      draft.startsAt = istanbulIso(date.year, date.month, date.day, times.startHour, times.startMinute);
      draft.endsAt = istanbulIso(date.year, date.month, date.day, times.endHour, times.endMinute);
    }
    return draft;
  }

  async draftFaq(input: EventDraft) {
    return [
      { question: 'Etkinlik nerede yapılacak?', answer: input.venueName ?? 'Mekân bilgisi henüz eklenmedi.' },
      { question: 'Kontenjan var mı?', answer: input.capacity ? `Kontenjan ${input.capacity} kişiyle sınırlıdır.` : 'Kontenjan bilgisini etkinlik sayfasından inceleyebilirsiniz.' },
    ];
  }
}
