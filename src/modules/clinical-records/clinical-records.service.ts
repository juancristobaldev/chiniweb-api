import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateClinicalRecordDto, UpdateClinicalRecordDto } from "./dto/clinical-record.dto";

@Injectable()
export class ClinicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    return this.prisma.clinicalRecord.findMany({
      where: { patientId, isDeleted: false },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        appointment: { select: { id: true, startTime: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByType(patientId: string, type: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    return this.prisma.clinicalRecord.findMany({
      where: { patientId, type: type as any, isDeleted: false },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        appointment: { select: { id: true, startTime: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const record = await this.prisma.clinicalRecord.findUnique({
      where: { id },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        patient: { select: { id: true, firstName: true, lastName: true, rut: true, tenantId: true } },
        appointment: {
          include: { locale: { select: { id: true, name: true } } },
        },
        attachments: true,
      },
    });
    if (!record) throw new NotFoundException("Registro clínico no encontrado");
    if (record.patient.tenantId !== tenantId) {
      throw new ForbiddenException("No tiene acceso a este registro");
    }
    return record;
  }

  async create(dentistId: string, tenantId: string, dto: CreateClinicalRecordDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado o no pertenece a su clínica");

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, tenantId, patientId: dto.patientId },
      });
      if (!appointment) throw new NotFoundException("Cita no encontrada");
    }

    return this.prisma.clinicalRecord.create({
      data: {
        patientId: dto.patientId,
        dentistId,
        appointmentId: dto.appointmentId,
        type: dto.type,
        content: dto.content,
      },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateClinicalRecordDto) {
    const record = await this.findById(id, tenantId);
    const data: any = {};
    if (dto.content) data.content = dto.content;
    return this.prisma.clinicalRecord.update({ where: { id }, data });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.clinicalRecord.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getLatestMedicalInfo(patientId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    const [info, anamnesis] = await Promise.all([
      this.prisma.medicalInfo.findUnique({ where: { patientId } }),
      this.prisma.clinicalRecord.findFirst({
        where: { patientId, type: "ANAMNESIS", isDeleted: false },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { medicalInfo: info, latestAnamnesis: anamnesis };
  }
}
