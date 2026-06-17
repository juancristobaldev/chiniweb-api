import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

const tenantContext = new AsyncLocalStorage<string | null>();

export function getCurrentTenantId(): string | null {
  return tenantContext.getStore() ?? null;
}

export { tenantContext };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    const tenantModels = [
      "Locale", "Dentist", "Patient",
      "Appointment", "Budget", "Payment",
    ];

    this.$use(async (params, next) => {
      const tenantId = tenantContext.getStore();
      if (!tenantId) return next(params);

      if (params.model && tenantModels.includes(params.model)) {
        const action = params.action;

        if (action === "findMany" || action === "findFirst" || action === "findUnique") {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          if (params.args.where.tenantId === undefined) {
            params.args.where.tenantId = tenantId;
          }
        }

        if (action === "create" || action === "createMany") {
          if (!params.args) params.args = {};
          if (!params.args.data) params.args.data = {};
          if (Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((d: any) => ({
              ...d,
              tenantId: d.tenantId || tenantId,
            }));
          } else {
            params.args.data.tenantId = params.args.data.tenantId || tenantId;
          }
        }

        if (action === "update" || action === "updateMany" || action === "delete" || action === "deleteMany") {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          if (params.args.where.tenantId === undefined) {
            params.args.where.tenantId = tenantId;
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
