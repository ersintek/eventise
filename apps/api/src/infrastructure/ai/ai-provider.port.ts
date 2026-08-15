export interface EventDraft {
  title?: string;
  summary?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  format?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  venueName?: string;
  venueAddress?: string;
  onlineLink?: string;
  capacity?: number;
  confidence: Record<string, number>;
}

export abstract class AiProvider {
  abstract extractEvent(text: string): Promise<EventDraft>;
  abstract draftFaq(input: EventDraft): Promise<Array<{ question: string; answer: string }>>;
}
