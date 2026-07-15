import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Public } from '../identity/policies/public.decorator';
import { FormsService } from './forms.service';
@Controller('public/event-forms/:eventId')
export class PublicFormsController { constructor(@Inject(FormsService) private forms: FormsService) {} @Public() @Get() get(@Param('eventId') eventId: string) { return this.forms.publicForEvent(eventId); } }
