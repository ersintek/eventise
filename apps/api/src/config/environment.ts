export interface Environment { [key: string]: string | undefined; }
const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM', 'S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'];
export function validateEnvironment(input: Environment): Environment {
  if (input.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter(key => !input[key]);
    if (missing.length) throw new Error(`Eksik üretim ortam değişkenleri: ${missing.join(', ')}`);
    if ((input.JWT_SECRET?.length ?? 0) < 32) throw new Error('JWT_SECRET en az 32 karakter olmalıdır.');
  }
  return input;
}
