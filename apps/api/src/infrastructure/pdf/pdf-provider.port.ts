export interface CertificateField { text: string; x: number; y: number; size: number; bold?: boolean; color?: string; align?: 'left' | 'center'; maxWidth?: number; }
export interface CertificateDocumentInput {
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  backgroundBytes?: Buffer | null;
  fields: CertificateField[];
  qrBytes?: Buffer | null;
  qrPosition?: { x: number; y: number; size: number };
}
export abstract class PdfProvider {
  abstract textDocument(title: string, lines: string[]): Promise<Buffer>;
  abstract certificateDocument(input: CertificateDocumentInput): Promise<Buffer>;
}
