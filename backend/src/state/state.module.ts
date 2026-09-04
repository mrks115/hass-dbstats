import { Module } from '@nestjs/common';
import { StateController } from './state.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateService } from './state.service.js';
import { States } from '../entities/homeass/2024.1.5/States.js';
import { StateAttributes } from '../entities/homeass/2024.1.5/StateAttributes.js';

@Module({
  imports: [TypeOrmModule.forFeature([States, StateAttributes], 'homeass')],
  controllers: [StateController],
  providers: [StateService],
})
export class StateModule {}
