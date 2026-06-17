import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { UserRole } from "../../common/enums/roles.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOdontogramItemDto, UpdateOdontogramItemDto, BatchCreateOdontogramItemDto } from "./dto/odontogram.dto";
import { CreateRecordDto } from "./dto/odontogram-record.dto";

@Injectable()
export class OdontogramService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(patientId: string, tenantId: string, dentistId: string, user?: any) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    if (user?.role === UserRole.PATIENT && patient.userId !== user.id) {
      throw new ForbiddenException("No puedes ver el odontograma de otro paciente");
    }

    let odontogram = await this.prisma.odontogram.findUnique({
      where: { patientId },
      include: {
        items: { orderBy: [{ toothCode: "asc" }, { surface: "asc" }] },
        records: { orderBy: { createdAt: "desc" } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!odontogram && user?.role !== UserRole.PATIENT) {
      odontogram = await this.prisma.odontogram.create({
        data: { patientId, lastUpdatedBy: dentistId },
        include: {
          items: true,
          records: true,
          dentist: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }

    return odontogram || { id: null, patientId, items: [], records: [] };
  }

  async getMine(userId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId, tenantId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return this.getOrCreate(patient.id, tenantId, userId, { id: userId, role: UserRole.PATIENT });
  }

  async addItem(patientId: string, tenantId: string, dentistId: string, dto: CreateOdontogramItemDto) {
    const odontogram = await this.getOrCreate(patientId, tenantId, dentistId, { id: dentistId, role: UserRole.DENTIST });
    if (!odontogram.id) throw new NotFoundException("Odontograma no encontrado");

    const existing = await this.prisma.odontogramItem.findFirst({
      where: { odontogramId: odontogram.id, toothCode: dto.toothCode, surface: dto.surface },
    });

    if (existing) {
      return this.prisma.odontogramItem.update({
        where: { id: existing.id },
        data: { procedure: dto.procedure, status: dto.status || "PENDIENTE", color: dto.color, notes: dto.notes },
      });
    }

    return this.prisma.odontogramItem.create({
      data: {
        odontogramId: odontogram.id, toothCode: dto.toothCode, surface: dto.surface,
        procedure: dto.procedure, status: dto.status || "PENDIENTE", color: dto.color, notes: dto.notes,
      },
    });
  }

  async updateItem(id: string, tenantId: string, dto: UpdateOdontogramItemDto) {
    const item = await this.prisma.odontogramItem.findUnique({
      where: { id },
      include: { odontogram: { include: { patient: { select: { tenantId: true } } } } },
    });
    if (!item) throw new NotFoundException("Item no encontrado");
    if (item.odontogram.patient.tenantId !== tenantId) {
      throw new ForbiddenException("No tiene acceso a este odontograma");
    }
    return this.prisma.odontogramItem.update({ where: { id }, data: dto });
  }

  async addItems(patientId: string, tenantId: string, dentistId: string, dto: BatchCreateOdontogramItemDto) {
    const results: any[] = [];
    for (const item of dto.items) {
      results.push(await this.addItem(patientId, tenantId, dentistId, item));
    }
    return results;
  }

  async removeItem(id: string, tenantId: string) {
    const item = await this.prisma.odontogramItem.findUnique({
      where: { id },
      include: { odontogram: { include: { patient: { select: { tenantId: true } } } } },
    });
    if (!item) throw new NotFoundException("Item no encontrado");
    if (item.odontogram.patient.tenantId !== tenantId) {
      throw new ForbiddenException("No tiene acceso a este odontograma");
    }
    await this.prisma.odontogramItem.delete({ where: { id } });
    return { message: "Item eliminado" };
  }

  async removeAllFromTooth(patientId: string, tenantId: string, toothCode: number) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    const odontogram = await this.prisma.odontogram.findUnique({ where: { patientId } });
    if (!odontogram) throw new NotFoundException("Odontograma no encontrado");

    await this.prisma.odontogramItem.deleteMany({
      where: { odontogramId: odontogram.id, toothCode },
    });
    return { message: `Diente ${toothCode} limpiado` };
  }

  async createRecord(patientId: string, tenantId: string, user: any, dto: CreateRecordDto) {
    const odontogram = await this.getOrCreate(patientId, tenantId, user.id, user);
    if (!odontogram.id) throw new NotFoundException("Odontograma no encontrado");

    const record = await this.prisma.odontogramRecord.create({
      data: {
        odontogramId: odontogram.id,
        creatorId: user.id,
        creatorName: `${user.firstName} ${user.lastName}`,
        toothNumber: dto.toothNumber,
        faces: dto.faces || [],
        catalogId: dto.catalogId,
        status: dto.status,
        notes: dto.notes,
      },
    });

    await this.prisma.odontogram.update({
      where: { id: odontogram.id },
      data: { lastUpdatedBy: user.id },
    });

    return record;
  }

  async getRecords(patientId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    const odontogram = await this.prisma.odontogram.findUnique({
      where: { patientId },
      select: { id: true },
    });
    if (!odontogram) return [];

    return this.prisma.odontogramRecord.findMany({
      where: { odontogramId: odontogram.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteRecord(id: string, tenantId: string) {
    const record = await this.prisma.odontogramRecord.findUnique({
      where: { id },
      include: { odontogram: { include: { patient: { select: { tenantId: true } } } } },
    });
    if (!record) throw new NotFoundException("Registro no encontrado");
    if (record.odontogram.patient.tenantId !== tenantId) {
      throw new ForbiddenException("No tiene acceso a este odontograma");
    }
    await this.prisma.odontogramRecord.delete({ where: { id } });
    return { message: "Registro eliminado" };
  }

  async setDentition(patientId: string, tenantId: string, user: any, dentition: string) {
    const odontogram = await this.getOrCreate(patientId, tenantId, user.id, user);
    if (!odontogram.id) throw new NotFoundException("Odontograma no encontrado");

    return this.prisma.odontogram.update({
      where: { id: odontogram.id },
      data: { dentition, lastUpdatedBy: user.id },
    });
  }
}
