import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { LocalesService } from "./locales.service";
import { CreateLocaleDto, UpdateLocaleDto, CreateBoxDto, UpdateBoxDto, CreateSpecialtyDto } from "./dto/locale.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("locales")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocalesController {
  constructor(private readonly localesService: LocalesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findAll(@Req() req: any) {
    const tenantId = req.user.role === UserRole.ADMIN ? undefined : req.user.tenantId;
    return this.localesService.findAll(tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST)
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.localesService.findById(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER)
  async create(@Req() req: any, @Body() dto: CreateLocaleDto) {
    return this.localesService.create(req.user.tenantId, dto);
  }

  @Put(":id")
  @Roles(UserRole.OWNER)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateLocaleDto) {
    return this.localesService.update(id, req.user.tenantId, dto);
  }

  @Post(":id/toggle-active")
  @Roles(UserRole.OWNER)
  async toggleActive(@Param("id") id: string, @Req() req: any) {
    return this.localesService.toggleActive(id, req.user.tenantId);
  }

  @Post(":id/boxes")
  @Roles(UserRole.OWNER)
  async addBox(@Param("id") id: string, @Req() req: any, @Body() dto: CreateBoxDto) {
    return this.localesService.addBox(id, req.user.tenantId, dto);
  }

  @Put(":localeId/boxes/:boxId")
  @Roles(UserRole.OWNER)
  async updateBox(
    @Param("localeId") localeId: string,
    @Param("boxId") boxId: string,
    @Req() req: any,
    @Body() dto: UpdateBoxDto,
  ) {
    return this.localesService.updateBox(boxId, localeId, req.user.tenantId, dto);
  }

  @Delete(":localeId/boxes/:boxId")
  @Roles(UserRole.OWNER)
  async removeBox(@Param("localeId") localeId: string, @Param("boxId") boxId: string, @Req() req: any) {
    return this.localesService.removeBox(boxId, localeId, req.user.tenantId);
  }

  @Post(":id/specialties")
  @Roles(UserRole.OWNER)
  async addSpecialty(@Param("id") id: string, @Req() req: any, @Body() dto: CreateSpecialtyDto) {
    return this.localesService.addSpecialty(id, req.user.tenantId, dto);
  }

  @Delete(":localeId/specialties/:specialtyId")
  @Roles(UserRole.OWNER)
  async removeSpecialty(
    @Param("localeId") localeId: string,
    @Param("specialtyId") specialtyId: string,
    @Req() req: any,
  ) {
    return this.localesService.removeSpecialty(specialtyId, localeId, req.user.tenantId);
  }
}
