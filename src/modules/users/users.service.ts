import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { UserRole } from "../../common/enums/roles.enum";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        tenantId: true,
        avatarUrl: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users;
  }

  async findById(id: string, tenantId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        tenant: { select: { id: true, name: true, rut: true } },
        dentistProfile: true,
        patientProfile: true,
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado");

    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("El email ya existe");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        tenantId: dto.tenantId,
      },
    });

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto, tenantId?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, ...(tenantId ? { tenantId } : {}) } });
    if (!user) throw new NotFoundException("Usuario no encontrado");

    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    delete data.password;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash, ...safe } = updated;
    return safe;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Usuario no encontrado");

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "Usuario desactivado" };
  }
}
