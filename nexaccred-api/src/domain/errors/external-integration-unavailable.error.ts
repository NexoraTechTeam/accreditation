/**
 * Thrown by an integration adapter (AIHCM or Platform Audit) when the
 * upstream system cannot be reached or rejects the request. Deliberately a
 * plain domain error, not a NestJS HttpException — the domain/application
 * layers must not import framework types. interface/ maps this to a 503 with
 * a "data unavailable" body, per PRD §9 ("degrade gracefully with 'data
 * unavailable'" when an external system's API isn't reachable).
 */
export class ExternalIntegrationUnavailableError extends Error {
  constructor(
    public readonly systemCode: 'PLATFORM_AUDIT' | 'AIHCM',
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ExternalIntegrationUnavailableError';
  }
}
