import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto } from "./dto/appointment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("appointments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findAll(@Req() req: any, @Query() query?: AppointmentQueryDto) {
    const tenantId = req.user.role === UserRole.ADMIN ? undefined : req.user.tenantId;
    return this.appointmentsService.findAll(
      tenantId,
      req.user.id,
      req.user.role,
      query,
    );
  }

  @Get("me")
  @Roles(UserRole.PATIENT)
  async findMine(@Req() req: any, @Query() query?: AppointmentQueryDto) {
    return this.appointmentsService.findForPatientUser(req.user.id, req.user.tenantId, query, req.user.firstName, req.user.lastName);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.appointmentsService.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(
      req.user.tenantId,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Put(":id")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, req.user.tenantId, dto);
  }

  @Put(":id/confirm")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async confirm(@Param("id") id: string, @Req() req: any) {
    return this.appointmentsService.confirm(id, req.user.tenantId);
  }

  @Put(":id/attend")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async attend(@Param("id") id: string, @Req() req: any) {
    return this.appointmentsService.markAttended(id, req.user.tenantId);
  }

  @Put(":id/no-show")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async noShow(@Param("id") id: string, @Req() req: any) {
    return this.appointmentsService.markNoShow(id, req.user.tenantId);
  }

  @Put(":id/cancel")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async cancel(@Param("id") id: string, @Req() req: any) {
    return this.appointmentsService.cancel(id, req.user.tenantId);
  }

  @Put(":id/start")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async start(@Param("id") id: string, @Req() req: any) {
    return this.appointmentsService.start(id, req.user.tenantId);
  }

  @Get("summary/:date")
  @Roles(UserRole.DENTIST)
  async getDailySummary(@Param("date") date: string, @Req() req: any) {
    return this.appointmentsService.getDailySummary(req.user.tenantId, req.user.id, date);
  }
}
