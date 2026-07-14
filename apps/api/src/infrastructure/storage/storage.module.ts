import { Global, Module } from '@nestjs/common';
import { DevelopmentStorageProvider } from './development-storage-provider';
import { StorageProvider } from './storage-provider.port';
import { ConfigService } from '@nestjs/config';
import { S3StorageProvider } from './s3-storage-provider';
@Global() @Module({ providers: [DevelopmentStorageProvider, { provide: S3StorageProvider, inject: [ConfigService], useFactory: (config: ConfigService) => config.get('NODE_ENV') === 'production' ? new S3StorageProvider(config) : null }, { provide: StorageProvider, inject: [ConfigService, DevelopmentStorageProvider, S3StorageProvider], useFactory: (config: ConfigService, development: DevelopmentStorageProvider, s3: S3StorageProvider | null) => config.get('NODE_ENV') === 'production' ? s3 : development }], exports: [StorageProvider] }) export class StorageModule {}
