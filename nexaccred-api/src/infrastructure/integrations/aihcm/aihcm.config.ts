import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AihcmConfig {
  constructor(private readonly config: ConfigService) {}

  get baseUrl(): string {
    return this.config.get<string>('AIHCM_BASE_URL', 'http://localhost:8080');
  }

  get tenantCode(): string {
    return this.config.get<string>('AIHCM_TENANT_CODE', 'demo-id');
  }

  get loginEmail(): string {
    return this.config.get<string>('AIHCM_LOGIN_EMAIL', 'admin@demo.aihcm.local');
  }

  get loginPassword(): string {
    return this.config.get<string>('AIHCM_LOGIN_PASSWORD', 'ChangeMe123!');
  }
}
