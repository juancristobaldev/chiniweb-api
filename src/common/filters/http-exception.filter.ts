import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Error interno del servidor";
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object") {
        message = (res as any).message || message;
        errors = (res as any).errors;
      }
      this.logger.error(`${request.method} ${request.url} ${status} - ${JSON.stringify(message)}`);
    } else {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `${request.method} ${request.url} ${status} - Error no controlado: ${error.message}`,
        error.stack,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message : message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
