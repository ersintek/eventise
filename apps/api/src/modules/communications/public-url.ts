const defaultPublicAppUrl = 'https://eventise.sici.dev';

export function toPublicUrl(path: string, baseUrl?: string) {
  const normalizedBaseUrl = (baseUrl || process.env.PUBLIC_APP_URL || defaultPublicAppUrl).replace(/\/+$/, '');
  return `${normalizedBaseUrl}/${path.replace(/^\/+/, '')}`;
}
