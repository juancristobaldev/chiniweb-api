import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Public } from "../../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      };
    }
  }
}
