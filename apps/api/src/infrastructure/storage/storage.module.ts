import { Global, Module } from '@nestjs/common';
import { DevelopmentStorageProvider } from './development-storage-provider';
import { StorageProvider } from './storage-provider.port';
@Global() @Module({ providers: [DevelopmentStorageProvider, { provide: StorageProvider, useExisting: DevelopmentStorageProvider }], exports: [StorageProvider] }) export class StorageModule {}
