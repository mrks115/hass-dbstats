import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Statistics } from './Statistics.js';
import { StatisticsShortTerm } from './StatisticsShortTerm.js';
import type { Statistics as StatisticsType } from './Statistics.js';
import type { StatisticsShortTerm as StatisticsShortTermType } from './StatisticsShortTerm.js';

@Index('statistics_meta_pkey', ['id'], { unique: true })
@Index('ix_statistics_meta_statistic_id', ['statisticId'], { unique: true })
@Entity('statistics_meta', { schema: 'public' })
export class StatisticsMeta {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({
    name: 'statistic_id',
    nullable: true,
    length: 255,
  })
  statisticId: string | null;

  @Column({ name: 'source', nullable: true, length: 32 })
  source: string | null;

  @Column({
    name: 'unit_of_measurement',
    nullable: true,
    length: 255,
  })
  unitOfMeasurement: string | null;

  @Column('boolean', { name: 'has_mean', nullable: true })
  hasMean: boolean | null;

  @Column('boolean', { name: 'has_sum', nullable: true })
  hasSum: boolean | null;

  @Column({ name: 'name', nullable: true, length: 255 })
  name: string | null;

  @OneToMany(() => Statistics, (statistics) => statistics.metadata)
  statistics: StatisticsType[];

  @OneToMany(
    () => StatisticsShortTerm,
    (statisticsShortTerm) => statisticsShortTerm.metadata,
  )
  statisticsShortTerms: StatisticsShortTermType[];
}
