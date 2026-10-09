import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cop31EventStatus, Prisma } from '@prisma/client';
import { timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { Cop31EventContentDto, Cop31EventDto, CreateCop31EventDto } from './dto/cop31-event.dto';

@Injectable()
export class Cop31Service {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  assertEditorKey(candidate?: string) {
    const key = this.config.get<string>('COP31_EDITOR_KEY');
    if (!key) throw new ServiceUnavailableException('COP31 editör erişimi henüz yapılandırılmadı.');
    const given = Buffer.from(candidate ?? '');
    const expected = Buffer.from(key);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new ForbiddenException('Editör erişimi doğrulanamadı.');
  }

  async listPublic() {
    return this.prisma.cop31Event.findMany({
      where: { status: { in: [Cop31EventStatus.PUBLISHED, Cop31EventStatus.POSTPONED, Cop31EventStatus.CANCELLED] } },
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getPublic(slug: string) {
    const event = await this.prisma.cop31Event.findFirst({ where: { slug, status: { in: [Cop31EventStatus.PUBLISHED, Cop31EventStatus.POSTPONED, Cop31EventStatus.CANCELLED] } } });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    return event;
  }

  async listEditor() {
    return this.prisma.cop31Event.findMany({ orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }] });
  }

  async create(dto: CreateCop31EventDto) {
    await this.assertDates(dto);
    this.assertPublicationVerification(dto);
    const slug = dto.slug.trim().toLowerCase();
    if (await this.prisma.cop31Event.findUnique({ where: { slug } })) throw new ConflictException('Bu bağlantı kısa adı kullanımda.');
    return this.prisma.cop31Event.create({ data: { ...this.toData(dto), slug } });
  }

  async update(id: string, dto: Cop31EventDto) {
    await this.assertDates(dto);
    this.assertPublicationVerification(dto);
    if (!await this.prisma.cop31Event.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('Etkinlik bulunamadı.');
    return this.prisma.cop31Event.update({ where: { id }, data: this.toData(dto) });
  }

  private async assertDates(dto: Pick<Cop31EventDto, 'startsAt' | 'endsAt' | 'timezone'>) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime())) || (endsAt && endsAt <= startsAt)) throw new BadRequestException('Etkinlik tarihleri geçerli olmalı; bitiş saati başlangıçtan sonra olmalı.');
    try { new Intl.DateTimeFormat('en-CA', { timeZone: dto.timezone }); } catch { throw new BadRequestException('Saat dilimi geçerli bir IANA zaman bölgesi olmalı.'); }
  }

  private assertPublicationVerification(dto: Pick<Cop31EventDto, 'status' | 'verifiedAt'>) {
    const isPublic = dto.status === Cop31EventStatus.PUBLISHED || dto.status === Cop31EventStatus.POSTPONED || dto.status === Cop31EventStatus.CANCELLED;
    if (!isPublic) return;
    if (!dto.verifiedAt) throw new BadRequestException('Yayınlanan etkinliklerde son doğrulama tarihi zorunludur.');
    if (new Date(dto.verifiedAt).getTime() > Date.now()) throw new BadRequestException('Son doğrulama tarihi gelecekte olamaz.');
  }

  private toData(dto: Cop31EventDto) {
    const publicRecord = dto.status === Cop31EventStatus.PUBLISHED || dto.status === Cop31EventStatus.POSTPONED || dto.status === Cop31EventStatus.CANCELLED;
    const tr = this.cleanContent(dto.contentTr, publicRecord, 'Türkçe');
    const en = this.cleanContent(dto.contentEn, publicRecord, 'English');
    return {
      contentTr: tr as Prisma.InputJsonValue, contentEn: en as Prisma.InputJsonValue,
      // Keep the original columns populated for safe, additive migration and a
      // future Eventise import. Public rendering never reads these projections.
      titleTr: tr.title, titleEn: en.title, summaryTr: tr.summary, summaryEn: en.summary,
      descriptionTr: tr.description ?? null, descriptionEn: en.description ?? null,
      startsAt: new Date(dto.startsAt), endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      timezone: dto.timezone.trim(), format: dto.format,
      venueName: tr.venueName ?? null, venueAddress: tr.venueAddress ?? null, city: tr.city ?? null, country: tr.country ?? null,
      organizers: tr.organizers, organizerUrl: tr.organizerUrl ?? null, languages: tr.languages, topics: tr.topics,
      cop31Connection: tr.cop31Connection, registrationUrl: tr.registrationUrl ?? null, informationUrl: tr.informationUrl ?? null,
      sourceUrl: tr.sourceUrl, status: dto.status, featured: dto.featured ?? false,
      verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt) : null,
    };
  }

  private cleanContent(content: Cop31EventContentDto, required: boolean, language: string) {
    const text = (value?: string | null) => value?.trim() || undefined;
    const value = (entry?: string | null) => entry?.trim() || '';
    const words = (values?: string[]) => values?.map(entry => entry.trim()).filter(Boolean) ?? [];
    const clean = {
      title: value(content.title), summary: value(content.summary), description: text(content.description),
      venueName: text(content.venueName), venueAddress: text(content.venueAddress), city: text(content.city), country: text(content.country),
      organizers: words(content.organizers), organizerUrl: text(content.organizerUrl), languages: words(content.languages), topics: words(content.topics),
      cop31Connection: value(content.cop31Connection), access: text(content.access), registrationUrl: text(content.registrationUrl), informationUrl: text(content.informationUrl), sourceUrl: value(content.sourceUrl),
    };
    if (!required) return clean;
    const missing = [
      clean.title.length >= 2 ? null : 'başlık',
      clean.summary.length >= 20 ? null : 'kısa özet',
      clean.organizers.length ? null : 'düzenleyen kurum',
      clean.languages.length ? null : 'etkinlik dili',
      clean.cop31Connection ? null : 'COP31 bağlantısı',
      clean.sourceUrl ? null : 'kaynak bağlantısı',
    ].filter((entry): entry is string => Boolean(entry));
    if (missing.length) throw new BadRequestException(`${language} içeriğinde eksik alanlar var: ${missing.join(', ')}.`);
    return clean;
  }
}
