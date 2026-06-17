import { Controller, Get, UseGuards } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStatsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("stats")
  async getStats() {
    return this.tenantsService.getStats();
  }
}
