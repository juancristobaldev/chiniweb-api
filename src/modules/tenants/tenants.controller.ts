import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto, UpdateTenantDto } from "./dto/tenant.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("admin/tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.tenantsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(":id")
  async suspend(@Param("id") id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(":id/activate")
  async activate(@Param("id") id: string) {
    return this.tenantsService.activate(id);
  }
}
