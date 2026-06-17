import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../common/enums/roles.enum";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async findAll(@CurrentUser() user: any) {
    const tenantId = user.role === UserRole.ADMIN ? undefined : user.tenantId;
    return this.usersService.findAll(tenantId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    const tenantId = user.role === UserRole.ADMIN ? undefined : user.tenantId;
    return this.usersService.findById(id, tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN) {
      dto.role = dto.role === UserRole.ADMIN ? UserRole.OWNER : dto.role;
      dto.tenantId = user.tenantId;
    }
    return this.usersService.create(dto);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    const tenantId = user.role === UserRole.ADMIN ? undefined : user.tenantId;
    if (user.role !== UserRole.ADMIN) {
      delete (dto as any).tenantId;
      if ((dto as any).role === UserRole.ADMIN) (dto as any).role = UserRole.OWNER;
    }
    return this.usersService.update(id, dto, tenantId);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
