import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { FileEntityType, FileType } from "@prisma/client";
import { UserRole } from "../../common/enums/roles.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAttachmentDto, UpdateAttachmentDto } from "./dto/attachment.dto";

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, tenantId: string, user: any) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: { id: true, userId: true },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    if (user.role === UserRole.PATIENT && patient.userId !== user.id) {
      throw new ForbiddenException("No puedes ver documentos de otro paciente");
    }

    return this.prisma.attachment.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findMine(userId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return this.findByPatient(patient.id, tenantId, { id: userId, role: UserRole.PATIENT });
  }

  async create(tenantId: string, uploadedBy: string, dto: CreateAttachmentDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    if (dto.treatmentPlanId) {
      const plan = await this.prisma.treatmentPlan.findFirst({
        where: { id: dto.treatmentPlanId, patientId: dto.patientId, patient: { tenantId } },
      });
      if (!plan) throw new NotFoundException("Tratamiento no encontrado");
    }

    if (dto.clinicalRecordId) {
      const record = await this.prisma.clinicalRecord.findFirst({
        where: { id: dto.clinicalRecordId, patientId: dto.patientId, patient: { tenantId } },
      });
      if (!record) throw new NotFoundException("Registro clínico no encontrado");
    }

    return this.prisma.attachment.create({
      data: {
        entityType: dto.entityType || FileEntityType.PATIENT,
        entityId: dto.entityId || dto.patientId,
        patientId: dto.patientId,
        treatmentPlanId: dto.treatmentPlanId,
        clinicalRecordId: dto.clinicalRecordId,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileName: dto.fileName,
        fileSize: dto.fileSize || 0,
        uploadedBy,
      },
    });
  }

  async createFromUpload(tenantId: string, uploadedBy: string, file: any, body: any) {
    if (!file) throw new NotFoundException("Archivo no recibido");
    const baseUrl = process.env.API_PUBLIC_URL || "http://localhost:4000";
    return this.create(tenantId, uploadedBy, {
      patientId: body.patientId,
      entityType: body.entityType,
      entityId: body.entityId,
      treatmentPlanId: body.treatmentPlanId,
      clinicalRecordId: body.clinicalRecordId,
      fileUrl: `${baseUrl}/uploads/${file.filename}`,
      fileType: body.fileType || FileType.DOCUMENT,
      fileName: body.fileName || file.originalname,
      fileSize: file.size || 0,
    });
  }

  async update(id: string, tenantId: string, dto: UpdateAttachmentDto) {
    const attachment = await this.findByIdForTenant(id, tenantId);
    return this.prisma.attachment.update({
      where: { id: attachment.id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    const attachment = await this.findByIdForTenant(id, tenantId);
    await this.prisma.attachment.delete({ where: { id: attachment.id } });
    return { message: "Documento eliminado" };
  }

  private async findByIdForTenant(id: string, tenantId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, patient: { tenantId } },
    });
    if (!attachment) throw new NotFoundException("Documento no encontrado");
    return attachment;
  }
}
