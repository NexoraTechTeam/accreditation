import { ArgumentsHost, Catch, ExceptionFilter, ServiceUnavailableException } from '@nestjs/common';
import { Response } from 'express';
import { ExternalIntegrationUnavailableError } from '../../domain/errors/external-integration-unavailable.error';

/**
 * Maps the domain's ExternalIntegrationUnavailableError to HTTP 503 with a
 * body that names which system is down. This is where PRD §9's "degrade
 * gracefully with 'data unavailable'" mitigation actually lands for API
 * consumers, instead of a raw 500.
 */
@Catch(ExternalIntegrationUnavailableError)
export class ExternalIntegrationUnavailableFilter implements ExceptionFilter {
  catch(exception: ExternalIntegrationUnavailableError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = new ServiceUnavailableException().getStatus();
    response.status(status).json({
      statusCode: status,
      error: 'Service Unavailable',
      system: exception.systemCode,
      message: exception.message,
    });
  }
}
