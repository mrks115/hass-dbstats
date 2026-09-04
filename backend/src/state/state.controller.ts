import { Controller, Get } from '@nestjs/common';
import { StateService } from './state.service.js';

@Controller('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Get('countStates')
  async countEventTypes() {
    return this.stateService.countStateTypes();
  }

  @Get('countAttributesSize')
  async countAttributesSize() {
    return this.stateService.countAttributesSize();
  }

  @Get('countRecentStateWrites')
  async countRecentStateWrites() {
    return this.stateService.countRecentStateWrites();
  }
}
