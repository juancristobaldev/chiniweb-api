import { Module } from "@nestjs/common";
import { AdminSetupController } from "./admin-setup.controller";

@Module({
  controllers: [AdminSetupController],
})
export class AdminSetupModule {}
