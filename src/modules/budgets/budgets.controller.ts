import { Controller, Delete, Get, Post, Put, Body, Param, UseGuards, Req } from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto, UpdateBudgetDto } from "./dto/budget.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("budgets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

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
  async create(@Req() req: any, @Body() dto: CreateBudgetDto) {
    return this.service.create(req.user.id, req.user.tenantId, dto);
  }

  @Put(":id")
  @Roles(UserRole.DENTIST)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateBudgetDto) {
    return this.service.update(id, req.user.tenantId, dto);
  }

  @Put(":id/approve")
  @Roles(UserRole.DENTIST)
  async approve(@Param("id") id: string, @Req() req: any) {
    return this.service.approve(id, req.user.tenantId);
  }

  @Put(":id/reject")
  @Roles(UserRole.DENTIST)
  async reject(@Param("id") id: string, @Req() req: any) {
    return this.service.reject(id, req.user.tenantId);
  }

  @Put(":id/send")
  @Roles(UserRole.DENTIST)
  async send(@Param("id") id: string, @Req() req: any) {
    return this.service.sendToPatient(id, req.user.tenantId);
  }

  @Post(":id/items")
  @Roles(UserRole.DENTIST)
  async addItem(@Param("id") id: string, @Req() req: any, @Body() dto: any) {
    return this.service.addItem(id, req.user.tenantId, dto);
  }

  @Put(":id/items/:itemId")
  @Roles(UserRole.DENTIST)
  async updateItem(@Param("id") id: string, @Param("itemId") itemId: string, @Req() req: any, @Body() dto: any) {
    return this.service.updateItem(id, itemId, req.user.tenantId, dto);
  }

  @Delete(":id/items/:itemId")
  @Roles(UserRole.DENTIST)
  async removeItem(@Param("id") id: string, @Param("itemId") itemId: string, @Req() req: any) {
    return this.service.removeItem(id, itemId, req.user.tenantId);
  }

  @Delete(":id")
  @Roles(UserRole.DENTIST)
  async remove(@Param("id") id: string, @Req() req: any) {
    return this.service.remove(id, req.user.tenantId);
  }
}
