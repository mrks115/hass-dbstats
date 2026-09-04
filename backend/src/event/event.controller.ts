import { Controller, Get } from '@nestjs/common';
import { EventService } from './event.service.js';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('countEventTypes')
  async countEventTypes() {
    return await this.eventService.countEventTypes();
  }

  @Get('countEventsByDomain')
  async countEventsBuDomain() {
    return await this.eventService.countEventsByDomain();
  }
}
