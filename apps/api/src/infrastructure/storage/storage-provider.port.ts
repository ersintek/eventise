export interface UploadGrant { key: string; uploadUrl: string; expiresAt: Date; }
export abstract class StorageProvider { abstract createUploadGrant(key: string, contentType: string, expiresInSeconds: number): Promise<UploadGrant>; abstract createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>; abstract delete(key: string): Promise<void>; }
