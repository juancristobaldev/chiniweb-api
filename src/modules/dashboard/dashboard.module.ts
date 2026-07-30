import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { HealthController } from "./health.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  controllers: [DashboardController, HealthController],
  providers: [DashboardService],
})
export class DashboardModule {}
