import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDentistDto, UpdateDentistDto, AssignLocalesDto } from "./dto/dentist.dto";

@Injectable()
export class DentistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string | undefined) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    return this.prisma.dentist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, isActive: true, lastLogin: true,
          },
        },
        locales: {
          include: {
            locale: { select: { id: true, name: true } },
          },
        },
        _count: { select: { locales: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const dentist = await this.prisma.dentist.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, isActive: true, lastLogin: true,
          },
        },
        locales: {
          include: {
            locale: { select: { id: true, name: true, isActive: true } },
          },
        },
      },
    });
    if (!dentist) throw new NotFoundException("Dentista no encontrado");
    return dentist;
  }

  async create(tenantId: string, dto: CreateDentistDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("El email ya está registrado");
    await this.validateLocales(tenantId, dto.localeIds);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const lastDentist = await this.prisma.dentist.findFirst({
      where: { tenantId },
      orderBy: { licenseNumber: "desc" },
    });
    const nextNumber = lastDentist?.licenseNumber
      ? parseInt(lastDentist.licenseNumber.replace("REG-", ""), 10) + 1
      : 1;
    const licenseNumber = `REG-${String(nextNumber).padStart(4, "0")}`;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email, passwordHash,
        firstName: dto.firstName, lastName: dto.lastName,
        phone: dto.phone, role: "DENTIST", tenantId,
      },
    });

    const dentist = await this.prisma.dentist.create({
      data: { userId: user.id, tenantId, specialty: dto.specialty, licenseNumber },
    });

    for (const localeId of dto.localeIds) {
      await this.prisma.dentistLocale.create({ data: { dentistId: dentist.id, localeId } });
    }

    return this.findById(dentist.id, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateDentistDto) {
    const dentist = await this.findById(id, tenantId);

    if (dto.firstName || dto.lastName || dto.phone || dto.password) {
      const userUpdate: any = {};
      if (dto.firstName) userUpdate.firstName = dto.firstName;
      if (dto.lastName) userUpdate.lastName = dto.lastName;
      if (dto.phone) userUpdate.phone = dto.phone;
      if (dto.password) userUpdate.passwordHash = await bcrypt.hash(dto.password, 12);

      await this.prisma.user.update({
        where: { id: dentist.userId },
        data: userUpdate,
      });
    }

    await this.prisma.dentist.update({
      where: { id },
      data: { specialty: dto.specialty, licenseNumber: dto.licenseNumber, isActive: dto.isActive },
    });

    return this.findById(id, tenantId);
  }

  async toggleActive(id: string, tenantId: string) {
    const dentist = await this.findById(id, tenantId);
    const updated = await this.prisma.dentist.update({
      where: { id },
      data: { isActive: !dentist.isActive },
    });
    await this.prisma.user.update({
      where: { id: dentist.userId },
      data: { isActive: updated.isActive },
    });
    return updated;
  }

  async assignLocales(id: string, tenantId: string, dto: AssignLocalesDto) {
    await this.findById(id, tenantId);
    await this.validateLocales(tenantId, dto.localeIds);
    await this.prisma.dentistLocale.deleteMany({ where: { dentistId: id } });
    for (const localeId of dto.localeIds) {
      await this.prisma.dentistLocale.create({ data: { dentistId: id, localeId } });
    }
    return this.findById(id, tenantId);
  }

  async getStats(id: string, tenantId: string) {
    const dentist = await this.findById(id, tenantId);
    const dentistUserId = dentist.userId;

    const [totalAppointments, patientsCount, treatmentPlans] = await Promise.all([
      this.prisma.appointment.count({ where: { dentistId: dentistUserId, tenantId } }),
      this.prisma.appointment.groupBy({ by: ["patientId"], where: { dentistId: dentistUserId, tenantId } }),
      this.prisma.treatmentPlan.count({ where: { dentistId: dentistUserId } }),
    ]);
    return { totalAppointments, uniquePatients: patientsCount.length, treatmentPlans };
  }

  private async validateLocales(tenantId: string, localeIds: string[]) {
    const count = await this.prisma.locale.count({ where: { id: { in: localeIds }, tenantId } });
    if (count !== localeIds.length) throw new NotFoundException("Uno o más locales no existen");
  }
}
