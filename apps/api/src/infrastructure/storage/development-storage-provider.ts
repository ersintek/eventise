import { Injectable } from '@nestjs/common';
import { StorageProvider, UploadGrant } from './storage-provider.port';
@Injectable()
export class DevelopmentStorageProvider implements StorageProvider {
  async createUploadGrant(key: string, _contentType: string, expiresInSeconds: number): Promise<UploadGrant> { return { key, uploadUrl: `/api/development-storage/${encodeURIComponent(key)}`, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) }; }
  async createDownloadUrl(key: string): Promise<string> { return `/api/development-storage/${encodeURIComponent(key)}`; }
  async delete(_key: string): Promise<void> { return; }
}
