import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "../../common/enums/roles.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto, CreateStageDto, UpdateStageDto } from "./dto/treatment.dto";

@Injectable()
export class TreatmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, tenantId: string, user?: any) {
    await this.ensurePatientAccess(patientId, tenantId, user);

    return this.prisma.treatmentPlan.findMany({
      where: { patientId },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        stages: { orderBy: { step: "asc" } },
        _count: { select: { stages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findMine(userId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId, tenantId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return this.findByPatient(patient.id, tenantId, { id: userId, role: UserRole.PATIENT });
  }

  async findById(id: string, tenantId: string) {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, rut: true, tenantId: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        stages: { orderBy: { step: "asc" } },
        appointments: {
          include: { locale: { select: { id: true, name: true } } },
          orderBy: { startTime: "desc" },
          take: 10,
        },
      },
    });
    if (!plan) throw new NotFoundException("Plan no encontrado");
    if (plan.patient.tenantId !== tenantId) throw new NotFoundException("Plan no encontrado");
    return plan;
  }

  async create(dentistId: string, tenantId: string, dto: CreateTreatmentPlanDto) {
    const patient = await this.prisma.patient.findFirst({ where: { id: dto.patientId, tenantId } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    return this.prisma.treatmentPlan.create({
      data: {
        patientId: dto.patientId,
        dentistId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
        status: "PLANIFICADO",
      },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        stages: true,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateTreatmentPlanDto) {
    await this.findById(id, tenantId);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.treatmentPlan.update({ where: { id }, data });
  }

  async addStage(planId: string, tenantId: string, dto: CreateStageDto) {
    await this.findById(planId, tenantId);
    const lastStage = await this.prisma.treatmentStage.findFirst({
      where: { planId },
      orderBy: { step: "desc" },
    });
    const step = (lastStage?.step || 0) + 1;

    return this.prisma.treatmentStage.create({
      data: {
        planId,
        step,
        name: dto.name,
        description: dto.description,
        toothCode: dto.toothCode,
        status: "PLANIFICADO",
      },
    });
  }

  async updateStage(stageId: string, planId: string, tenantId: string, dto: UpdateStageDto) {
    await this.findById(planId, tenantId);
    const stage = await this.prisma.treatmentStage.findFirst({ where: { id: stageId, planId } });
    if (!stage) throw new NotFoundException("Etapa no encontrada");
    return this.prisma.treatmentStage.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status as any,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : dto.status === "COMPLETADO" ? new Date() : undefined,
      },
    });
  }

  async removeStage(stageId: string, planId: string, tenantId: string) {
    await this.findById(planId, tenantId);
    const stage = await this.prisma.treatmentStage.findFirst({ where: { id: stageId, planId } });
    if (!stage) throw new NotFoundException("Etapa no encontrada");
    await this.prisma.treatmentStage.delete({ where: { id: stageId } });
    return { message: "Etapa eliminada" };
  }

  async completePlan(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.treatmentStage.updateMany({
      where: { planId: id, status: { not: "COMPLETADO" } },
      data: { status: "COMPLETADO", completedAt: new Date() },
    });
    return this.prisma.treatmentPlan.update({
      where: { id },
      data: { status: "COMPLETADO", endDate: new Date() },
    });
  }

  private async ensurePatientAccess(patientId: string, tenantId: string, user?: any) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId }, select: { userId: true } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    if (user?.role === UserRole.PATIENT && patient.userId !== user.id) {
      throw new ForbiddenException("No puedes ver tratamientos de otro paciente");
    }
  }
}
