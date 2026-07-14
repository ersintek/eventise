import { Injectable } from '@nestjs/common';
import { StorageProvider, UploadGrant } from './storage-provider.port';
@Injectable()
export class DevelopmentStorageProvider implements StorageProvider {
  private readonly objects=new Map<string,Buffer>();
  async createUploadGrant(key: string, _contentType: string, expiresInSeconds: number): Promise<UploadGrant> { return { key, uploadUrl: `/api/development-storage?key=${encodeURIComponent(key)}`, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) }; }
  async createDownloadUrl(key: string): Promise<string> { return `/api/development-storage?key=${encodeURIComponent(key)}`; }
  async put(key:string,data:Buffer):Promise<void>{this.objects.set(key,Buffer.from(data));}
  get(key:string){return this.objects.get(key)}
  store(key:string,data:Buffer){this.objects.set(key,Buffer.from(data))}
  async delete(_key: string): Promise<void> { return; }
}
