import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealth() {
    return { status: 'ok', service: 'intranet-api' };
  }
}
