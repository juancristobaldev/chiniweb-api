import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { OdontogramService } from "./odontogram.service";
import { CreateOdontogramItemDto, UpdateOdontogramItemDto, BatchCreateOdontogramItemDto } from "./dto/odontogram.dto";
import { CreateRecordDto } from "./dto/odontogram-record.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("odontogram")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OdontogramController {
  constructor(private readonly service: OdontogramService) {}

  @Get("me")
  @Roles(UserRole.PATIENT)
  async getMine(@Req() req: any) {
    return this.service.getMine(req.user.id, req.user.tenantId);
  }

  @Get(":patientId")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST, UserRole.PATIENT)
  async get(@Param("patientId") patientId: string, @Req() req: any) {
    return this.service.getOrCreate(patientId, req.user.tenantId, req.user.id, req.user);
  }

  @Post(":patientId/items")
  @Roles(UserRole.DENTIST)
  async addItem(@Param("patientId") patientId: string, @Req() req: any, @Body() dto: CreateOdontogramItemDto) {
    return this.service.addItem(patientId, req.user.tenantId, req.user.id, dto);
  }

  @Post(":patientId/items/batch")
  @Roles(UserRole.DENTIST)
  async addItems(@Param("patientId") patientId: string, @Req() req: any, @Body() dto: BatchCreateOdontogramItemDto) {
    return this.service.addItems(patientId, req.user.tenantId, req.user.id, dto);
  }

  @Put("items/:id")
  @Roles(UserRole.DENTIST)
  async updateItem(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateOdontogramItemDto) {
    return this.service.updateItem(id, req.user.tenantId, dto);
  }

  @Delete("items/:id")
  @Roles(UserRole.DENTIST)
  async removeItem(@Param("id") id: string, @Req() req: any) {
    return this.service.removeItem(id, req.user.tenantId);
  }

  @Delete(":patientId/tooth/:toothCode")
  @Roles(UserRole.DENTIST)
  async removeTooth(@Param("patientId") patientId: string, @Param("toothCode") toothCode: number, @Req() req: any) {
    return this.service.removeAllFromTooth(patientId, req.user.tenantId, toothCode);
  }

  @Post(":patientId/records")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async createRecord(@Param("patientId") patientId: string, @Req() req: any, @Body() dto: CreateRecordDto) {
    return this.service.createRecord(patientId, req.user.tenantId, req.user, dto);
  }

  @Get(":patientId/records")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST, UserRole.PATIENT)
  async getRecords(@Param("patientId") patientId: string, @Req() req: any) {
    return this.service.getRecords(patientId, req.user.tenantId);
  }

  @Delete("records/:id")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async deleteRecord(@Param("id") id: string, @Req() req: any) {
    return this.service.deleteRecord(id, req.user.tenantId);
  }

  @Put(":patientId/dentition")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async setDentition(@Param("patientId") patientId: string, @Req() req: any, @Body("dentition") dentition: string) {
    return this.service.setDentition(patientId, req.user.tenantId, req.user, dentition);
  }
}
