import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { TreatmentsService } from "./treatments.service";
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto, CreateStageDto, UpdateStageDto } from "./dto/treatment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("treatments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  constructor(private readonly service: TreatmentsService) {}

  @Get("patient/:patientId")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST, UserRole.PATIENT)
  async findByPatient(@Param("patientId") patientId: string, @Req() req: any) {
    return this.service.findByPatient(patientId, req.user.tenantId, req.user);
  }

  @Get("me")
  @Roles(UserRole.PATIENT)
  async findMine(@Req() req: any) {
    return this.service.findMine(req.user.id, req.user.tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.service.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.DENTIST)
  async create(@Req() req: any, @Body() dto: CreateTreatmentPlanDto) {
    return this.service.create(req.user.id, req.user.tenantId, dto);
  }

  @Put(":id")
  @Roles(UserRole.DENTIST)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateTreatmentPlanDto) {
    return this.service.update(id, req.user.tenantId, dto);
  }

  @Post(":id/stages")
  @Roles(UserRole.DENTIST)
  async addStage(@Param("id") id: string, @Req() req: any, @Body() dto: CreateStageDto) {
    return this.service.addStage(id, req.user.tenantId, dto);
  }

  @Put(":planId/stages/:stageId")
  @Roles(UserRole.DENTIST)
  async updateStage(@Param("planId") planId: string, @Param("stageId") stageId: string, @Req() req: any, @Body() dto: UpdateStageDto) {
    return this.service.updateStage(stageId, planId, req.user.tenantId, dto);
  }

  @Delete(":planId/stages/:stageId")
  @Roles(UserRole.DENTIST)
  async removeStage(@Param("planId") planId: string, @Param("stageId") stageId: string, @Req() req: any) {
    return this.service.removeStage(stageId, planId, req.user.tenantId);
  }

  @Post(":id/complete")
  @Roles(UserRole.DENTIST)
  async completePlan(@Param("id") id: string, @Req() req: any) {
    return this.service.completePlan(id, req.user.tenantId);
  }
}
