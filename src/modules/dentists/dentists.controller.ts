import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from "@nestjs/common";
import { DentistsService } from "./dentists.service";
import { CreateDentistDto, UpdateDentistDto, AssignLocalesDto } from "./dto/dentist.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("dentists")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DentistsController {
  constructor(private readonly dentistsService: DentistsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async findAll(@Req() req: any) {
    const tenantId = req.user.role === UserRole.ADMIN ? undefined : req.user.tenantId;
    return this.dentistsService.findAll(tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.dentistsService.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER)
  async create(@Req() req: any, @Body() dto: CreateDentistDto) {
    return this.dentistsService.create(req.user.tenantId, dto);
  }

  @Put(":id")
  @Roles(UserRole.OWNER)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateDentistDto) {
    return this.dentistsService.update(id, req.user.tenantId, dto);
  }

  @Post(":id/toggle-active")
  @Roles(UserRole.OWNER)
  async toggleActive(@Param("id") id: string, @Req() req: any) {
    return this.dentistsService.toggleActive(id, req.user.tenantId);
  }

  @Post(":id/locales")
  @Roles(UserRole.OWNER)
  async assignLocales(@Param("id") id: string, @Req() req: any, @Body() dto: AssignLocalesDto) {
    return this.dentistsService.assignLocales(id, req.user.tenantId, dto);
  }

  @Get(":id/stats")
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getStats(@Param("id") id: string, @Req() req: any) {
    return this.dentistsService.getStats(id, req.user.tenantId);
  }
}
