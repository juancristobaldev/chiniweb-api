import { Body, Controller, Get, Put, UseGuards, Req } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("dashboard")
  @Roles(UserRole.OWNER)
  async getOwnerStats(@Req() req: any) {
    return this.dashboardService.getOwnerStats(req.user.tenantId);
  }

  @Get("dentist/dashboard")
  @Roles(UserRole.DENTIST)
  async getDentistStats(@Req() req: any) {
    return this.dashboardService.getDentistStats(req.user.tenantId, req.user.id);
  }

  @Get("owner/tenant")
  @Roles(UserRole.OWNER)
  async getOwnerTenant(@Req() req: any) {
    return this.dashboardService.getOwnerTenant(req.user.tenantId);
  }

  @Put("owner/tenant")
  @Roles(UserRole.OWNER)
  async updateOwnerTenant(@Req() req: any, @Body() dto: any) {
    return this.dashboardService.updateOwnerTenant(req.user.tenantId, dto);
  }

  @Get("admin/subscriptions")
  @Roles(UserRole.ADMIN)
  async getAdminSubscriptions() {
    return this.dashboardService.getAdminSubscriptions();
  }

  @Get("admin/audit-logs")
  @Roles(UserRole.ADMIN)
  async getAdminAuditLogs() {
    return this.dashboardService.getAdminAuditLogs();
  }

  @Get("admin/settings")
  @Roles(UserRole.ADMIN)
  async getAdminSettings() {
    return this.dashboardService.getAdminSettings();
  }

  @Put("admin/settings")
  @Roles(UserRole.ADMIN)
  async updateAdminSettings(@Body() dto: Record<string, string>) {
    return this.dashboardService.updateAdminSettings(dto);
  }
}
