import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'nexaccred-api', timestamp: new Date().toISOString() };
  }
}
