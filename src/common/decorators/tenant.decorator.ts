import { SetMetadata } from "@nestjs/common";

export const TENANT_KEY = "scope";
export const TenantScope = (scope: "OWN" | "ALL") =>
  SetMetadata(TENANT_KEY, scope);
