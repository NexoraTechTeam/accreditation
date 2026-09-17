import { Injectable, Logger } from '@nestjs/common';
import { AihcmConfig } from './aihcm.config';
import { AihcmLoginResponse } from './aihcm.types';
import { ExternalIntegrationUnavailableError } from '../../../domain/errors/external-integration-unavailable.error';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

/**
 * Owns the AIHCM login flow (POST /api/v1/auth/login) and caches the JWT
 * until shortly before it expires. AIHCM resolves tenant from the JWT claim
 * server-side — there is no tenant header to send on subsequent calls, only
 * `Authorization: Bearer <token>` (confirmed from AihcmConfig/AuthController
 * source, see aihcm.types.ts).
 *
 * A single shared token is adequate here because this adapter always
 * authenticates as one integration account (AIHCM_LOGIN_EMAIL), not as an
 * individual NexAccred user — AIHCM has no concept of a NexAccred user.
 */
@Injectable()
export class AihcmAuthClient {
  private readonly logger = new Logger(AihcmAuthClient.name);
  private cached: CachedToken | null = null;
  private inFlightLogin: Promise<string> | null = null;

  constructor(private readonly config: AihcmConfig) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now + 30_000) {
      return this.cached.accessToken;
    }
    // Collapse concurrent callers into one login request rather than
    // stampeding AIHCM's auth endpoint when several requests race in at once.
    if (!this.inFlightLogin) {
      this.inFlightLogin = this.login().finally(() => {
        this.inFlightLogin = null;
      });
    }
    return this.inFlightLogin;
  }

  private async login(): Promise<string> {
    const url = `${this.config.baseUrl}/api/v1/auth/login`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantCode: this.config.tenantCode,
          email: this.config.loginEmail,
          password: this.config.loginPassword,
        }),
      });
    } catch (cause) {
      throw new ExternalIntegrationUnavailableError(
        'AIHCM',
        `Could not reach AIHCM at ${this.config.baseUrl} — is the AIHCM backend running?`,
        cause,
      );
    }

    if (!response.ok) {
      throw new ExternalIntegrationUnavailableError(
        'AIHCM',
        `AIHCM login rejected (HTTP ${response.status}) for tenant "${this.config.tenantCode}"`,
      );
    }

    const body = (await response.json()) as AihcmLoginResponse;
    this.cached = {
      accessToken: body.accessToken,
      expiresAt: Date.now() + body.expiresInMinutes * 60_000,
    };
    this.logger.log(`Authenticated to AIHCM as ${body.email} (tenant ${body.tenantId})`);
    return this.cached.accessToken;
  }
}
