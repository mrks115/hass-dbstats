import { join } from 'path';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import config from './config.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LogRequestsMiddleware } from './middleware/log-requests-middleware.service.js';
import { DatabaseModule } from './database.module.js';
import { EventModule } from './event/event.module.js';
import { StateModule } from './state/state.module.js';
import { StatisticModule } from './statistic/statistic.module.js';
import { SystemModule } from './system/system.module.js';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    EventModule,
    StateModule,
    StatisticModule,
    SystemModule,
    ServeStaticModule.forRoot({
      rootPath: '/var/www/html',
    }),
  ],
  exports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogRequestsMiddleware).forRoutes('*');
  }
}
