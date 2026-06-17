import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable, finalize } from "rxjs";
import { PrismaService, tenantContext } from "../../prisma/prisma.service";
import { UserRole } from "../enums/roles.enum";

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.tenantId && user.role !== UserRole.ADMIN) {
      tenantContext.enterWith(user.tenantId);
    }

    return next.handle().pipe(
      finalize(() => {
        tenantContext.enterWith(null);
      })
    );
  }
}
