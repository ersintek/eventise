export const LEGAL_DOCUMENTS = {
  USER_TERMS: { key: 'USER_TERMS', version: '1.0', title: 'Eventise Kullanıcı Sözleşmesi' },
  ORGANIZATION_TERMS: { key: 'ORGANIZATION_TERMS', version: '1.0', title: 'STK Yetkilisi ve Kurumsal Kullanım Sözleşmesi' },
  PRIVACY_NOTICE: { key: 'PRIVACY_NOTICE', version: '1.0', title: 'KVKK Aydınlatma Metni' },
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENTS;
