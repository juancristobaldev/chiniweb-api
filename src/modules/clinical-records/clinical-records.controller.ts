import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ClinicalRecordsService } from "./clinical-records.service";
import { CreateClinicalRecordDto, UpdateClinicalRecordDto } from "./dto/clinical-record.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("clinical-records")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalRecordsController {
  constructor(private readonly service: ClinicalRecordsService) {}

  @Get("patient/:patientId")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findByPatient(@Param("patientId") patientId: string, @Req() req: any) {
    return this.service.findByPatient(patientId, req.user.tenantId);
  }

  @Get("patient/:patientId/type/:type")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findByType(@Param("patientId") patientId: string, @Param("type") type: string, @Req() req: any) {
    return this.service.findByType(patientId, type, req.user.tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.service.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.DENTIST)
  async create(@Req() req: any, @Body() dto: CreateClinicalRecordDto) {
    return this.service.create(req.user.id, req.user.tenantId, dto);
  }

  @Put(":id")
  @Roles(UserRole.DENTIST)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateClinicalRecordDto) {
    return this.service.update(id, req.user.tenantId, dto);
  }

  @Delete(":id")
  @Roles(UserRole.DENTIST)
  async remove(@Param("id") id: string, @Req() req: any) {
    return this.service.softDelete(id, req.user.tenantId);
  }

  @Get("patient/:patientId/medical-info")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async getMedicalInfo(@Param("patientId") patientId: string, @Req() req: any) {
    return this.service.getLatestMedicalInfo(patientId, req.user.tenantId);
  }
}
