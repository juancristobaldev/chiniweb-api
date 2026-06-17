import { Injectable, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto } from "./dto/appointment.dto";
import { AppointmentStatus } from "@prisma/client";

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string | undefined, userId: string, role: string, query?: AppointmentQueryDto) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (role === "DENTIST") {
      where.dentistId = userId;
    }

    if (query?.dentistId && role !== "DENTIST") {
      where.dentistId = query.dentistId;
    }

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.localeId) {
      where.localeId = query.localeId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.date) {
      const date = new Date(query.date);
      if (query.view === "day") {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.startTime = { gte: start, lte: end };
      } else if (query.view === "week") {
        const start = new Date(date);
        const dayOfWeek = start.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
        where.startTime = { gte: start, lte: end };
      } else {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        where.startTime = { gte: start, lte: end };
      }
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true, firstName: true, lastName: true, rut: true,
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        dentist: {
          select: { id: true, firstName: true, lastName: true },
        },
        locale: {
          select: { id: true, name: true },
        },
        box: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: {
            id: true, firstName: true, lastName: true, rut: true, dob: true,
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
          },
        },
        dentist: {
          select: { id: true, firstName: true, lastName: true },
        },
        locale: {
          select: { id: true, name: true },
        },
        box: {
          select: { id: true, name: true },
        },
        clinicalRecords: {
          include: {
            dentist: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!appointment) throw new NotFoundException("Cita no encontrada");
    return appointment;
  }

  async findForPatientUser(userId: string, tenantId: string, query?: AppointmentQueryDto, firstName?: string, lastName?: string) {
    let patient = await this.prisma.patient.findFirst({ where: { userId, tenantId }, select: { id: true } });

    if (!patient && firstName && lastName) {
      patient = await this.prisma.patient.findFirst({
        where: { tenantId, firstName, lastName, userId: null },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (patient) {
        await this.prisma.patient.update({
          where: { id: patient.id },
          data: { userId },
        });
      }
    }

    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return this.findAll(tenantId, userId, "PATIENT", { ...query, patientId: patient.id });
  }

  async create(tenantId: string, actorId: string, role: string, dto: CreateAppointmentDto) {
    const dentistId = role === "DENTIST" ? actorId : dto.dentistId;
    if (!dentistId) throw new NotFoundException("Dentista no encontrado");
    await this.validateAppointmentReferences(tenantId, dentistId, dto);
    await this.ensureNoConflict(tenantId, dentistId, new Date(dto.startTime), new Date(dto.endTime));

    return this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        dentistId,
        localeId: dto.localeId,
        boxId: dto.boxId,
        treatmentPlanId: dto.treatmentPlanId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        type: dto.type,
        notes: dto.notes,
        status: "RESERVADA",
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        locale: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateAppointmentDto) {
    const apt = await this.findById(id, tenantId);
    const data: any = { ...dto };

    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);

    await this.validateAppointmentReferences(tenantId, apt.dentistId, {
      ...apt,
      ...dto,
      patientId: apt.patientId,
      localeId: dto.localeId || apt.localeId,
      boxId: dto.boxId ?? apt.boxId,
      treatmentPlanId: (dto as any).treatmentPlanId ?? apt.treatmentPlanId,
      startTime: (dto.startTime || apt.startTime).toString(),
      endTime: (dto.endTime || apt.endTime).toString(),
    });

    if (dto.startTime || dto.endTime) {
      await this.ensureNoConflict(
        tenantId,
        apt.dentistId,
        dto.startTime ? new Date(dto.startTime) : apt.startTime,
        dto.endTime ? new Date(dto.endTime) : apt.endTime,
        id,
      );
    }

    return this.prisma.appointment.update({ where: { id }, data });
  }

  async updateStatus(id: string, tenantId: string, status: AppointmentStatus) {
    await this.findById(id, tenantId);

    const statusTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      RESERVADA: ["CONFIRMADA", "CANCELADA", "NO_ASISTIO", "EN_ATENCION"],
      CONFIRMADA: ["EN_ATENCION", "CANCELADA", "NO_ASISTIO"],
      EN_ATENCION: ["FINALIZADA"],
      FINALIZADA: [],
      CANCELADA: [],
      NO_ASISTIO: [],
    };

    const current = await this.prisma.appointment.findUnique({ where: { id } });
    if (current && !statusTransitions[current.status].includes(status)) {
      throw new ConflictException(`No se puede cambiar de ${current.status} a ${status}`);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async confirm(id: string, tenantId: string) {
    return this.updateStatus(id, tenantId, "CONFIRMADA");
  }

  async markAttended(id: string, tenantId: string) {
    return this.updateStatus(id, tenantId, "FINALIZADA");
  }

  async start(id: string, tenantId: string) {
    return this.updateStatus(id, tenantId, "EN_ATENCION");
  }

  async markNoShow(id: string, tenantId: string) {
    return this.updateStatus(id, tenantId, "NO_ASISTIO");
  }

  async cancel(id: string, tenantId: string) {
    return this.updateStatus(id, tenantId, "CANCELADA");
  }

  async getDailySummary(tenantId: string, dentistId: string, date: string) {
    const [year, month, day] = date.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        dentistId,
        startTime: { gte: start, lte: end },
      },
      orderBy: { startTime: "asc" },
    });

    const byStatus = {
      total: appointments.length,
      RESERVADA: appointments.filter((a) => a.status === "RESERVADA").length,
      CONFIRMADA: appointments.filter((a) => a.status === "CONFIRMADA").length,
      EN_ATENCION: appointments.filter((a) => a.status === "EN_ATENCION").length,
      FINALIZADA: appointments.filter((a) => a.status === "FINALIZADA").length,
      CANCELADA: appointments.filter((a) => a.status === "CANCELADA").length,
      NO_ASISTIO: appointments.filter((a) => a.status === "NO_ASISTIO").length,
    };

    return { date, byStatus, appointments };
  }

  private async validateAppointmentReferences(tenantId: string, dentistId: string, dto: any) {
    const [dentist, patient, locale] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: dentistId, tenantId, role: "DENTIST", isActive: true } }),
      this.prisma.patient.findFirst({ where: { id: dto.patientId, tenantId } }),
      this.prisma.locale.findFirst({ where: { id: dto.localeId, tenantId, isActive: true } }),
    ]);
    if (!dentist) throw new NotFoundException("Dentista no encontrado");
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    if (!locale) throw new NotFoundException("Local no encontrado");

    if (dto.boxId) {
      const box = await this.prisma.box.findFirst({ where: { id: dto.boxId, localeId: dto.localeId, isActive: true } });
      if (!box) throw new NotFoundException("Box no encontrado");
    }

    if (dto.treatmentPlanId) {
      const plan = await this.prisma.treatmentPlan.findFirst({
        where: { id: dto.treatmentPlanId, patientId: dto.patientId, patient: { tenantId } },
      });
      if (!plan) throw new NotFoundException("Tratamiento no encontrado");
    }
  }

  private async ensureNoConflict(tenantId: string, dentistId: string, startTime: Date, endTime: Date, excludeId?: string) {
    if (endTime <= startTime) throw new ConflictException("La hora de término debe ser posterior al inicio");
    const conflicts = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        dentistId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        status: { notIn: ["CANCELADA", "NO_ASISTIO"] },
        OR: [
          { startTime: { lt: endTime, gte: startTime } },
          { endTime: { lte: endTime, gt: startTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    });
    if (conflicts) throw new ConflictException("El dentista ya tiene una cita en ese horario");
  }
}
