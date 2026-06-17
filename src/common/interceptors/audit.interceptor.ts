import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const user = request.user;
    const now = Date.now();

    if (!user || method === "GET") return next.handle();

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              tenantId: user.tenantId || null,
              action: `${method} ${url}`,
              entityType: this.extractEntityType(url),
              entityId: data?.id || request.params?.id || null,
              newValue: method !== "DELETE" ? this.sanitize(data) : undefined,
              oldValue: method === "DELETE" ? this.sanitize(data) : undefined,
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"] || null,
            },
          });
        } catch {}
      })
    );
  }

  private extractEntityType(url: string): string {
    const match = url.match(/\/api\/([^\/\?]+)/);
    return match?.[1] || "unknown";
  }

  private sanitize(data: any): any {
    if (!data) return undefined;
    const { passwordHash, refreshTokenHash, ...safe } = data;
    return safe;
  }
}
