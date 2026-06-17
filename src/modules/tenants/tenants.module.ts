import { Module } from "@nestjs/common";
import { TenantsController } from "./tenants.controller";
import { AdminStatsController } from "./admin-stats.controller";
import { TenantsService } from "./tenants.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [TenantsController, AdminStatsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
