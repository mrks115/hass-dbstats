import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config.js';
import { TypeOrmLoggerContainer } from './typeOrmLogger.js';
import { Module } from '@nestjs/common';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...config().typeOrmConfig,
      synchronize: false,
      entities: [__dirname + '/entities/homeass/2024.1.5/*{.ts,.js}'],
      logger: TypeOrmLoggerContainer.ForConnection(
        'homeass',
        config().db.logging || ['error'],
      ),
      name: 'homeass',
      maxQueryExecutionTime: 1000,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
