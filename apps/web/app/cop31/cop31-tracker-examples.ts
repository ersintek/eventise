import type { Cop31Event, Cop31Format } from './cop31-types';

type TrackerExample = {
  id: number;
  title: string;
  summary: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  format: Cop31Format;
  country: string;
  city: string;
  venue: string;
  organizers: string[];
  language: string;
  topics: string[];
  connection: string;
  sourceUrl: string;
  registrationUrl: string;
  featured?: boolean;
};

const checkedAt = '2026-09-23T12:00:00.000Z';

const examples: TrackerExample[] = [
  {
    id: 294, title: 'Insuring and investing in the low-carbon economy', summary: 'Session within the two-day Global Sustainable Insurance Summit convened alongside COP31.',
    startsAt: '2026-11-14T10:55:00.000Z', timezone: 'Europe/Istanbul', format: 'IN_PERSON', country: 'Türkiye', city: 'Antalya', venue: 'Insurance House, Titanic Deluxe Golf Belek',
    organizers: ['UNEP', 'UNEP FI', 'Insurance Association of Türkiye (TSB)'], language: 'English / Turkish context', topics: ['Insurance', 'Low-carbon investment'], connection: 'Direct — independent sector COP31 summit',
    sourceUrl: 'https://www.unepfi.org/industries/insurance/cop31/', registrationUrl: 'https://www.unepfi.org/industries/insurance/cop31/', featured: true,
  },
  {
    id: 347, title: 'Education for Climate Day 2026: Closing', summary: 'Closing session of the European Commission’s Education for Climate Day 2026, including a dedicated Pre-COP31 intergenerational session.',
    startsAt: '2026-10-22T15:35:00.000Z', endsAt: '2026-10-22T16:00:00.000Z', timezone: 'Europe/London', format: 'ONLINE', country: 'Online', city: 'Online', venue: 'Live-streamed online',
    organizers: ['Education for Climate Coalition', 'European Commission'], language: 'English', topics: ['Climate education', 'Participation'], connection: 'Pre-COP31 policy session',
    sourceUrl: 'https://education-for-climate.ec.europa.eu/educationforclimateday2026', registrationUrl: 'https://education-for-climate.ec.europa.eu/educationforclimateday2026',
  },
  {
    id: 131, title: 'Financial Protection Against Climate-related Shock', summary: 'Stakeholder session in the final day of the Fiji Pre-COP31 knowledge-exchange programme.',
    startsAt: '2026-10-07T22:15:00.000Z', endsAt: '2026-10-07T23:00:00.000Z', timezone: 'Pacific/Fiji', format: 'IN_PERSON', country: 'Fiji', city: 'Nadi', venue: 'Ballroom 5, Sofitel Fiji Resort & Spa',
    organizers: ['Pacific Islands Forum Secretariat'], language: 'English', topics: ['Risk finance', 'Resilience'], connection: 'Pre-COP stakeholder / COP31 preparation',
    sourceUrl: 'https://greenzone-precop31.com/program?view=list', registrationUrl: 'https://greenzone-precop31.com/program?view=list',
  },
  {
    id: 143, title: 'Innovative Finance for Pacific Climate Action', summary: 'Stakeholder session in the final day of the Fiji Pre-COP31 knowledge-exchange programme.',
    startsAt: '2026-10-08T01:15:00.000Z', endsAt: '2026-10-08T02:00:00.000Z', timezone: 'Pacific/Fiji', format: 'IN_PERSON', country: 'Fiji', city: 'Nadi', venue: 'Ballroom 5, Sofitel Fiji Resort & Spa',
    organizers: ['Pacific Community (SPC)'], language: 'English', topics: ['Climate finance'], connection: 'Pre-COP stakeholder / COP31 preparation',
    sourceUrl: 'https://greenzone-precop31.com/program?view=list', registrationUrl: 'https://greenzone-precop31.com/program?view=list',
  },
  {
    id: 137, title: 'Grassroots Recyclers’ Journey: Peaks and Valleys', summary: 'Stakeholder session in the final day of the Fiji Pre-COP31 knowledge-exchange programme.',
    startsAt: '2026-10-07T23:45:00.000Z', endsAt: '2026-10-08T00:30:00.000Z', timezone: 'Pacific/Fiji', format: 'IN_PERSON', country: 'Fiji', city: 'Nadi', venue: 'Convention 2, Crowne Plaza Fiji Nadi Bay',
    organizers: ['Waste Recyclers Fiji Limited', 'Pacific Recycling Foundation'], language: 'English', topics: ['Waste', 'Circular economy'], connection: 'Pre-COP stakeholder / COP31 preparation',
    sourceUrl: 'https://greenzone-precop31.com/program?view=list', registrationUrl: 'https://greenzone-precop31.com/program?view=list',
  },
  {
    id: 511, title: 'Carbon Markets Governance: Compliance and Voluntary Markets', summary: 'Online lecture in the 2026 Climate Change E-Academy; the series concludes with a dedicated COP31 debrief.',
    startsAt: '2026-10-22T08:00:00.000Z', endsAt: '2026-10-22T09:30:00.000Z', timezone: 'Europe/London', format: 'ONLINE', country: 'Online', city: 'Online', venue: 'Online',
    organizers: ['Durham University Centre for Sustainable Development Law and Policy', 'NUS Centre for International Law'], language: 'English', topics: ['Carbon markets', 'Governance'], connection: 'Climate-law capacity building linked to COP31',
    sourceUrl: 'https://dur.ac.uk/research/institutes-and-centres/csdlp/professional-opportunities-/climate-change-e-academy/programme-outline/', registrationUrl: 'https://pay.durham.ac.uk/event-durham/climate-change-e-academy-2026',
  },
  {
    id: 365, title: 'Africa — Space observation serving climate action in Africa', summary: 'Regional session in the SCO’s fully online low-carbon congress running in parallel with COP31.',
    startsAt: '2026-11-20T09:00:00.000Z', endsAt: '2026-11-20T10:30:00.000Z', timezone: 'UTC', format: 'ONLINE', country: 'Online', city: 'Online', venue: '100% virtual',
    organizers: ['Space for Climate Observatory', 'SANSA (South Africa)', 'Kenya Space Agency'], language: 'English', topics: ['Africa', 'Earth observation'], connection: 'Direct — virtual congress running in parallel with COP31',
    sourceUrl: 'https://www.spaceclimateobservatory.org/sco-world-virtual-congress', registrationUrl: 'https://www.spaceclimateobservatory.org/sco-world-virtual-congress',
  },
  {
    id: 392, title: 'COP31: Engaging all local government services in sustainability', summary: 'Virtual event on practical sustainability delivery by local authorities in the context of COP31’s implementation focus.',
    startsAt: '2026-11-18T10:00:00.000Z', endsAt: '2026-11-18T11:30:00.000Z', timezone: 'Europe/London', format: 'ONLINE', country: 'Online', city: 'Online', venue: 'Virtual',
    organizers: ['Local Government Association (UK)'], language: 'English', topics: ['Local government', 'Sustainability', 'Resilience'], connection: 'Direct — virtual event explicitly framed around COP31',
    sourceUrl: 'https://www.local.gov.uk/', registrationUrl: 'https://www.local.gov.uk/',
  },
  {
    id: 380, title: 'Building for What’s Next: Corporate Energy Strategies in a Transition Economy', summary: 'Morning programme item in Energy Shift Capital’s independent COP31 investment forum.',
    startsAt: '2026-11-13T09:10:00.000Z', endsAt: '2026-11-13T09:50:00.000Z', timezone: 'Europe/Istanbul', format: 'IN_PERSON', country: 'Türkiye', city: 'Antalya / Aksu', venue: 'IC Santai Hotel; exact room confirmed to approved attendees',
    organizers: ['Energy Shift Capital'], language: 'English', topics: ['Corporate energy strategy'], connection: 'Direct — independent COP31 energy-transition investment forum',
    sourceUrl: 'https://luma.com/pwdt2vel', registrationUrl: 'https://luma.com/pwdt2vel', featured: true,
  },
  {
    id: 125, title: 'Just transition Pacific Island frontline workers', summary: 'Stakeholder session in the final day of the Fiji Pre-COP31 knowledge-exchange programme.',
    startsAt: '2026-10-07T21:00:00.000Z', endsAt: '2026-10-07T21:45:00.000Z', timezone: 'Pacific/Fiji', format: 'IN_PERSON', country: 'Fiji', city: 'Nadi', venue: 'Convention 3, Crowne Plaza Fiji Nadi Bay',
    organizers: ['Public Services International', 'Council of Pacific Education'], language: 'English', topics: ['Just transition', 'Labour'], connection: 'Pre-COP stakeholder / COP31 preparation',
    sourceUrl: 'https://greenzone-precop31.com/program?view=list', registrationUrl: 'https://greenzone-precop31.com/program?view=list',
  },
];

export const trackerExampleEvents: Cop31Event[] = examples.map(example => ({
  id: `tracker-${example.id}`,
  slug: `tracker-${example.id}`,
  contentTr: {
    title: example.title, summary: example.summary, description: example.summary, venueName: example.venue, city: example.city, country: example.country,
    organizers: example.organizers, languages: [example.language], topics: example.topics, cop31Connection: example.connection, access: 'Registration required', sourceUrl: example.sourceUrl, registrationUrl: example.registrationUrl,
  },
  contentEn: {
    title: example.title, summary: example.summary, description: example.summary, venueName: example.venue, city: example.city, country: example.country,
    organizers: example.organizers, languages: [example.language], topics: example.topics, cop31Connection: example.connection, access: 'Registration required', sourceUrl: example.sourceUrl, registrationUrl: example.registrationUrl,
  },
  startsAt: example.startsAt, endsAt: example.endsAt ?? null, timezone: example.timezone, format: example.format, status: 'PUBLISHED', featured: Boolean(example.featured), verifiedAt: checkedAt, createdAt: checkedAt, updatedAt: checkedAt,
}));
