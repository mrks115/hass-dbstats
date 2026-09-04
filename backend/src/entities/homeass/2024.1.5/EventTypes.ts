import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Events } from './Events.js';
import type { Events as EventsType } from './Events.js';

@Index('ix_event_types_event_type', ['eventType'], { unique: true })
@Index('event_types_pkey', ['eventTypeId'], { unique: true })
@Entity('event_types', { schema: 'public' })
export class EventTypes {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'event_type_id' })
  eventTypeId: number;

  @Column({
    name: 'event_type',
    nullable: true,
    length: 64,
  })
  eventType: string | null;

  @OneToMany(() => Events, (events) => events.eventType_2)
  events: EventsType[];
}
