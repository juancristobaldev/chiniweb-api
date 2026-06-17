import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PUBLIC_KEY } from "../decorators/public.decorator";
import { UserRole } from "../enums/roles.enum";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return true;

    if (user.role === UserRole.ADMIN) return true;

    if (user.role !== UserRole.ADMIN && !user.tenantId) {
      throw new ForbiddenException("Usuario sin tenant asignado");
    }

    return true;
  }
}
