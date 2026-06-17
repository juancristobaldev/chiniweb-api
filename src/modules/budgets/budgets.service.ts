import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "../../common/enums/roles.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBudgetDto, UpdateBudgetDto } from "./dto/budget.dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, tenantId: string, user?: any) {
    await this.ensurePatientAccess(patientId, tenantId, user);
    return this.prisma.budget.findMany({
      where: { patientId, tenantId },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        items: true,
        payments: { select: { id: true, amount: true, method: true, status: true, paidAt: true } },
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
    const budget = await this.prisma.budget.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, rut: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        items: true,
        payments: true,
      },
    });
    if (!budget) throw new NotFoundException("Presupuesto no encontrado");
    return budget;
  }

  async create(dentistId: string, tenantId: string, dto: CreateBudgetDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    if (dto.localeId) {
      const locale = await this.prisma.locale.findFirst({ where: { id: dto.localeId, tenantId } });
      if (!locale) throw new NotFoundException("Local no encontrado");
    }

    const subtotal = dto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discount = dto.discount || 0;
    const total = subtotal - discount;

    const budget = await this.prisma.budget.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        dentistId,
        localeId: dto.localeId,
        subtotal,
        discount,
        total,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes,
        status: "BORRADOR",
      },
    });

    for (const item of dto.items) {
      await this.prisma.budgetItem.create({
        data: {
          budgetId: budget.id,
          toothCode: item.toothCode,
          procedure: item.procedure,
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.unitPrice * item.quantity,
        },
      });
    }

    return this.findById(budget.id, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateBudgetDto) {
    const budget = await this.findById(id, tenantId);
    const data: any = { ...dto };
    if (dto.discount !== undefined) {
      data.total = Number(budget.subtotal) - dto.discount;
    }
    return this.prisma.budget.update({ where: { id }, data });
  }

  async addItem(id: string, tenantId: string, item: any) {
    await this.findById(id, tenantId);
    await this.prisma.budgetItem.create({
      data: {
        budgetId: id,
        toothCode: item.toothCode,
        procedure: item.procedure,
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.unitPrice * item.quantity,
      },
    });
    await this.recalculateTotals(id, tenantId);
    return this.findById(id, tenantId);
  }

  async updateItem(id: string, itemId: string, tenantId: string, item: any) {
    await this.findById(id, tenantId);
    const existing = await this.prisma.budgetItem.findFirst({ where: { id: itemId, budgetId: id } });
    if (!existing) throw new NotFoundException("Item no encontrado");
    await this.prisma.budgetItem.update({
      where: { id: itemId },
      data: { ...item, total: item.unitPrice !== undefined || item.quantity !== undefined ? (item.unitPrice ?? Number(existing.unitPrice)) * (item.quantity ?? existing.quantity) : undefined },
    });
    await this.recalculateTotals(id, tenantId);
    return this.findById(id, tenantId);
  }

  async removeItem(id: string, itemId: string, tenantId: string) {
    await this.findById(id, tenantId);
    const existing = await this.prisma.budgetItem.findFirst({ where: { id: itemId, budgetId: id } });
    if (!existing) throw new NotFoundException("Item no encontrado");
    await this.prisma.budgetItem.delete({ where: { id: itemId } });
    await this.recalculateTotals(id, tenantId);
    return this.findById(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.budget.delete({ where: { id } });
    return { message: "Presupuesto eliminado" };
  }

  async approve(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.budget.update({
      where: { id },
      data: { status: "ACEPTADO", acceptedAt: new Date() },
    });
  }

  async reject(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.budget.update({
      where: { id },
      data: { status: "RECHAZADO", rejectedAt: new Date() },
    });
  }

  async sendToPatient(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.budget.update({
      where: { id },
      data: { status: "ENVIADO" },
    });
  }

  private async ensurePatientAccess(patientId: string, tenantId: string, user?: any) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId }, select: { userId: true } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    if (user?.role === UserRole.PATIENT && patient.userId !== user.id) {
      throw new ForbiddenException("No puedes ver presupuestos de otro paciente");
    }
  }

  private async recalculateTotals(id: string, tenantId: string) {
    const budget = await this.findById(id, tenantId);
    const subtotal = budget.items.reduce((sum, item) => sum + Number(item.total), 0);
    const total = subtotal - Number(budget.discount || 0);
    await this.prisma.budget.update({ where: { id }, data: { subtotal, total } });
  }
}
