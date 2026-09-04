import { Module } from '@nestjs/common';
import { SystemController } from './system.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemService } from './system.service.js';
import { Statistics } from '../entities/homeass/2024.1.5/Statistics.js';
import { StatisticsShortTerm } from '../entities/homeass/2024.1.5/StatisticsShortTerm.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Statistics, StatisticsShortTerm], 'homeass'),
  ],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
