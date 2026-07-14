export interface EventDraft { title?:string; description?:string; startsAt?:string; venueName?:string; address?:string; capacity?:number; confidence:Record<string,number> }
export abstract class AiProvider { abstract extractEvent(text:string):Promise<EventDraft>; abstract draftFaq(input:EventDraft):Promise<Array<{question:string;answer:string}>>; }
