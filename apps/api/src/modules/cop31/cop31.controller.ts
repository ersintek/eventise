import { Body, Controller, Get, Headers, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../identity/policies/public.decorator';
import { Cop31EventDto, CreateCop31EventDto } from './dto/cop31-event.dto';
import { Cop31Service } from './cop31.service';

@ApiTags('cop31')
@Controller()
export class Cop31Controller {
  constructor(@Inject(Cop31Service) private readonly cop31: Cop31Service) {}

  @Public() @Get('public/cop31/events') listPublic() { return this.cop31.listPublic(); }
  @Public() @Get('public/cop31/events/:slug') getPublic(@Param('slug') slug: string) { return this.cop31.getPublic(slug); }

  @Public() @Get('cop31/events') listEditor(@Headers('x-cop31-editor-key') key?: string) { this.cop31.assertEditorKey(key); return this.cop31.listEditor(); }
  @Public() @Post('cop31/events') create(@Headers('x-cop31-editor-key') key: string | undefined, @Body() dto: CreateCop31EventDto) { this.cop31.assertEditorKey(key); return this.cop31.create(dto); }
  @Public() @Patch('cop31/events/:id') update(@Headers('x-cop31-editor-key') key: string | undefined, @Param('id') id: string, @Body() dto: Cop31EventDto) { this.cop31.assertEditorKey(key); return this.cop31.update(id, dto); }
}
