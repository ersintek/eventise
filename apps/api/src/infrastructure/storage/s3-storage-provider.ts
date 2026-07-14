import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, UploadGrant } from './storage-provider.port';

@Injectable()
export class S3StorageProvider implements StorageProvider, OnModuleInit {
  private readonly client: S3Client; private readonly bucket: string;
  constructor(@Inject(ConfigService) config: ConfigService) {
    this.bucket = config.getOrThrow('S3_BUCKET');
    this.client = new S3Client({ endpoint: config.getOrThrow('S3_ENDPOINT'), region: config.get('S3_REGION', 'auto'), forcePathStyle: config.get('S3_FORCE_PATH_STYLE', 'true') === 'true', credentials: { accessKeyId: config.getOrThrow('S3_ACCESS_KEY'), secretAccessKey: config.getOrThrow('S3_SECRET_KEY') } });
  }
  async onModuleInit() {
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
        return;
      } catch {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          return;
        } catch (error) {
          if (attempt === 30) throw error;
          await new Promise(resolve => setTimeout(resolve, 2_000));
        }
      }
    }
  }
  private safeKey(key: string) { if (!/^[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(key) || key.includes('..')) throw new BadRequestException('Geçersiz depolama anahtarı.'); return key; }
  async createUploadGrant(key: string, contentType: string, expiresInSeconds: number): Promise<UploadGrant> { const safe = this.safeKey(key); return { key: safe, uploadUrl: await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: safe, ContentType: contentType }), { expiresIn: expiresInSeconds }), expiresAt: new Date(Date.now() + expiresInSeconds * 1000) }; }
  createDownloadUrl(key: string, expiresInSeconds: number) { return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key) }), { expiresIn: expiresInSeconds }); }
  async put(key:string,data:Buffer,contentType:string){await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:this.safeKey(key),Body:data,ContentType:contentType}));}
  async delete(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key) })); }
}
