import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "../../common/enums/roles.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePaymentDto } from "./dto/payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatient(patientId: string, tenantId: string, user?: any) {
    await this.ensurePatientAccess(patientId, tenantId, user);
    return this.prisma.payment.findMany({
      where: { patientId, tenantId },
      include: {
        budget: { select: { id: true, total: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findMine(userId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId, tenantId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return this.findByPatient(patient.id, tenantId, { id: userId, role: UserRole.PATIENT });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, rut: true } },
        budget: { select: { id: true, total: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, rut: true } },
        budget: { select: { id: true, total: true, status: true } },
      },
    });
    if (!payment) throw new NotFoundException("Pago no encontrado");
    return payment;
  }

  async create(tenantId: string, dto: CreatePaymentDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    if (dto.budgetId) {
      const budget = await this.prisma.budget.findFirst({
        where: { id: dto.budgetId, tenantId, patientId: dto.patientId },
      });
      if (!budget) throw new NotFoundException("Presupuesto no encontrado");
    }

    return this.prisma.payment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        budgetId: dto.budgetId,
        amount: dto.amount,
        method: dto.method,
        status: "PAGADO",
        paidAt: new Date(),
        notes: dto.notes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getSummary(tenantId: string) {
    const [total, pending, byMethod] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, status: "PAGADO" },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: "PENDIENTE" },
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ["method"],
        where: { tenantId, status: "PAGADO" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPaid: Number(total._sum.amount || 0),
      totalPending: Number(pending._sum.amount || 0),
      byMethod: byMethod.map((m) => ({
        method: m.method,
        total: Number(m._sum.amount || 0),
      })),
    };
  }

  private async ensurePatientAccess(patientId: string, tenantId: string, user?: any) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId }, select: { userId: true } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    if (user?.role === UserRole.PATIENT && patient.userId !== user.id) {
      throw new ForbiddenException("No puedes ver pagos de otro paciente");
    }
  }
}
