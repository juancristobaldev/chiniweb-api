import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { PatientsService } from "./patients.service";
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto, MedicalInfoDto } from "./dto/patient.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("patients")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get("me")
  @Roles(UserRole.PATIENT)
  async getMe(@Req() req: any) {
    return this.patientsService.getPatientByUserId(req.user.id, req.user.tenantId);
  }

  @Put("me")
  @Roles(UserRole.PATIENT)
  async updateMe(@Req() req: any, @Body() dto: UpdatePatientDto) {
    return this.patientsService.updateByUserId(req.user.id, req.user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findAll(@Req() req: any, @Query() query?: PatientQueryDto) {
    const tenantId = req.user.role === UserRole.ADMIN ? undefined : req.user.tenantId;
    return this.patientsService.findAll(tenantId, query);
  }

  @Get("search")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async search(@Req() req: any, @Query("q") q: string) {
    const tenantId = req.user.role === UserRole.ADMIN ? undefined : req.user.tenantId;
    return this.patientsService.findAll(tenantId, { search: q });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.patientsService.findById(id, req.user.tenantId);
  }

  @Get(":id/history")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async getHistory(@Param("id") id: string, @Req() req: any) {
    return this.patientsService.getHistory(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async create(@Req() req: any, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(req.user.tenantId, dto, req.user);
  }

  @Put(":id")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, req.user.tenantId, dto);
  }

  @Put(":id/medical-info")
  @Roles(UserRole.DENTIST)
  async updateMedicalInfo(@Param("id") id: string, @Req() req: any, @Body() dto: MedicalInfoDto) {
    return this.patientsService.updateMedicalInfo(id, req.user.tenantId, dto);
  }
}
