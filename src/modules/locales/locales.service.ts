import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateLocaleDto, UpdateLocaleDto, CreateBoxDto, UpdateBoxDto, CreateSpecialtyDto } from "./dto/locale.dto";

@Injectable()
export class LocalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.locale.findMany({
      where: { tenantId },
      include: {
        _count: { select: { boxes: true, specialties: true, appointments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const locale = await this.prisma.locale.findFirst({
      where: { id, tenantId },
      include: {
        boxes: { orderBy: { name: "asc" } },
        specialties: { orderBy: { name: "asc" } },
        _count: { select: { appointments: true } },
      },
    });
    if (!locale) throw new NotFoundException("Local no encontrado");
    return locale;
  }

  async create(tenantId: string, dto: CreateLocaleDto) {
    return this.prisma.locale.create({
      data: {
        tenantId,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        timezone: dto.timezone,
        openingHours: dto.openingHours || {},
        color: dto.color,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateLocaleDto) {
    await this.findById(id, tenantId);
    return this.prisma.locale.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string, tenantId: string) {
    const locale = await this.findById(id, tenantId);
    return this.prisma.locale.update({
      where: { id },
      data: { isActive: !locale.isActive },
    });
  }

  async addBox(localeId: string, tenantId: string, dto: CreateBoxDto) {
    await this.findById(localeId, tenantId);
    return this.prisma.box.create({
      data: { localeId, name: dto.name },
    });
  }

  async updateBox(boxId: string, localeId: string, tenantId: string, dto: UpdateBoxDto) {
    await this.findById(localeId, tenantId);
    const box = await this.prisma.box.findFirst({ where: { id: boxId, localeId } });
    if (!box) throw new NotFoundException("Box no encontrado");
    return this.prisma.box.update({ where: { id: boxId }, data: dto });
  }

  async removeBox(boxId: string, localeId: string, tenantId: string) {
    await this.findById(localeId, tenantId);
    const box = await this.prisma.box.findFirst({ where: { id: boxId, localeId } });
    if (!box) throw new NotFoundException("Box no encontrado");
    await this.prisma.box.delete({ where: { id: boxId } });
    return { message: "Box eliminado" };
  }

  async addSpecialty(localeId: string, tenantId: string, dto: CreateSpecialtyDto) {
    await this.findById(localeId, tenantId);
    return this.prisma.specialty.create({
      data: { localeId, name: dto.name, color: dto.color },
    });
  }

  async removeSpecialty(specialtyId: string, localeId: string, tenantId: string) {
    await this.findById(localeId, tenantId);
    const specialty = await this.prisma.specialty.findFirst({ where: { id: specialtyId, localeId } });
    if (!specialty) throw new NotFoundException("Especialidad no encontrada");
    await this.prisma.specialty.delete({ where: { id: specialtyId } });
    return { message: "Especialidad eliminada" };
  }
}
