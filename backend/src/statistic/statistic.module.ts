import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticService } from './statistic.service.js';
import { Statistics } from '../entities/homeass/2024.1.5/Statistics.js';
import { StatisticsShortTerm } from '../entities/homeass/2024.1.5/StatisticsShortTerm.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Statistics, StatisticsShortTerm], 'homeass'),
  ],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticModule {}
