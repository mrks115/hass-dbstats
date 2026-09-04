import { Module } from '@nestjs/common';
import { EventController } from './event.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service.js';
import { Events } from '../entities/homeass/2024.1.5/Events.js';
import { EventData } from '../entities/homeass/2024.1.5/EventData.js';

@Module({
  imports: [TypeOrmModule.forFeature([Events, EventData], 'homeass')],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
