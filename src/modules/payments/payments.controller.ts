import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/payment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

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

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async findByTenant(@Req() req: any) {
    return this.service.findByTenant(req.user.tenantId);
  }

  @Get("summary")
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getSummary(@Req() req: any) {
    return this.service.getSummary(req.user.tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.service.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return this.service.create(req.user.tenantId, dto);
  }
}
