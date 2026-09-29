export interface CertificateField { text: string; x: number; y: number; size: number; bold?: boolean; color?: string; align?: 'left' | 'center'; maxWidth?: number; }
export interface CertificateDocumentInput {
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  backgroundBytes?: Buffer | null;
  fields: CertificateField[];
  qrBytes?: Buffer | null;
  qrPosition?: { x: number; y: number; size: number };
}
export interface AttendanceSignatureDocumentInput {
  organizationName: string;
  eventTitle: string;
  rows: Array<{ firstName: string; lastName: string; email: string }>;
}
export abstract class PdfProvider {
  abstract textDocument(title: string, lines: string[]): Promise<Buffer>;
  abstract certificateDocument(input: CertificateDocumentInput): Promise<Buffer>;
  abstract attendanceSignatureDocument(input: AttendanceSignatureDocumentInput): Promise<Buffer>;
}
