import { Module } from '@nestjs/common';
import { Cop31Controller } from './cop31.controller';
import { Cop31Service } from './cop31.service';

@Module({ controllers: [Cop31Controller], providers: [Cop31Service] })
export class Cop31Module {}
