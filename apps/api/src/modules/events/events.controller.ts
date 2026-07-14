import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { CreateEventDto, EventPhaseDto, EventStateDto, UpdateEventDto } from './dto/event.dto'; import { EventsService } from './events.service';
@ApiTags('events') @Controller()
export class EventsController { constructor(@Inject(EventsService) private events: EventsService) {}
  @ApiBearerAuth() @Post('organizations/:organizationId/events') create(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Body() d: CreateEventDto) { return this.events.create(u.id,o,d); }
  @ApiBearerAuth() @Get('organizations/:organizationId/events') list(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string) { return this.events.list(u.id,o); }
  @ApiBearerAuth() @Patch('organizations/:organizationId/events/:eventId') update(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('eventId')e:string,@Body()d:UpdateEventDto){return this.events.update(u.id,o,e,d);}
  @ApiBearerAuth() @Patch('organizations/:organizationId/events/:eventId/state') state(@CurrentUser() u: AuthenticatedUser,@Param('organizationId') o:string,@Param('eventId') e:string,@Body() d:EventStateDto){return this.events.setState(u.id,o,e,d);}
  @ApiBearerAuth() @Patch('organizations/:organizationId/events/:eventId/phase') phase(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('eventId')e:string,@Body()d:EventPhaseDto){return this.events.setPhase(u.id,o,e,d.phase);}
  @Public() @Get('public/events/:orgSlug/:eventSlug') publicGet(@Param('orgSlug') o:string,@Param('eventSlug') e:string){return this.events.publicGet(o,e);}
}
