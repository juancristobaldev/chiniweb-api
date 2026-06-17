import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnerStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      newPatients,
      todayAppointments,
      monthlyRevenue,
      topTreatments,
      topDentists,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { tenantId, isActive: true } }),
      this.prisma.patient.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.appointment.count({
        where: { tenantId, startTime: { gte: startOfDay, lt: endOfDay } },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth }, status: "PAGADO" },
        _sum: { amount: true },
      }),
      this.prisma.treatmentPlan.groupBy({
        by: ["name"],
        where: { patient: { tenantId }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      this.prisma.appointment.groupBy({
        by: ["dentistId"],
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const dentistIds = topDentists.map((d) => d.dentistId);
    const dentists = await this.prisma.user.findMany({
      where: { id: { in: dentistIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const dentistMap = new Map(dentists.map((d) => [d.id, d]));

    return {
      activePatients: totalPatients,
      newPatients,
      todayAppointments,
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      topTreatments: topTreatments.map((t) => ({
        name: t.name,
        count: t._count.id,
      })),
      topDentists: topDentists.map((d) => ({
        id: d.dentistId,
        name: `${dentistMap.get(d.dentistId)?.firstName || ""} ${dentistMap.get(d.dentistId)?.lastName || ""}`,
        appointments: d._count.id,
      })),
    };
  }

  async getAdminStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeClinics, totalUsers, totalDentists, totalPatients, monthlyRevenue] =
      await Promise.all([
        this.prisma.tenant.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.dentist.count({ where: { isActive: true } }),
        this.prisma.patient.count({ where: { isActive: true } }),
        this.prisma.payment.aggregate({
          where: { createdAt: { gte: startOfMonth }, status: "PAGADO" },
          _sum: { amount: true },
        }),
      ]);

    const monthlyAppointments = await this.prisma.appointment.count({
      where: { startTime: { gte: startOfMonth } },
    });

    const topClinics = await this.prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: { select: { patients: true, appointments: true } },
      },
      orderBy: { appointments: { _count: "desc" } },
      take: 5,
    });

    return {
      activeClinics,
      totalUsers,
      totalDentists,
      totalPatients,
      monthlyAppointments,
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      topClinics,
    };
  }

  async getDentistStats(tenantId: string, dentistId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAppointments, todayAttended, todayPending, weekAppointments, monthlyAppointments, uniquePatients] =
      await Promise.all([
        this.prisma.appointment.count({
          where: { tenantId, dentistId, startTime: { gte: startOfDay, lt: endOfDay } },
        }),
        this.prisma.appointment.count({
          where: { tenantId, dentistId, status: "FINALIZADA", startTime: { gte: startOfDay, lt: endOfDay } },
        }),
        this.prisma.appointment.count({
          where: { tenantId, dentistId, status: { in: ["RESERVADA", "CONFIRMADA"] }, startTime: { gte: startOfDay, lt: endOfDay } },
        }),
        this.prisma.appointment.count({
          where: { tenantId, dentistId, startTime: { gte: startOfWeek } },
        }),
        this.prisma.appointment.count({
          where: { tenantId, dentistId, startTime: { gte: startOfMonth } },
        }),
        this.prisma.appointment.groupBy({
          by: ["patientId"],
          where: { tenantId, dentistId },
          _count: { patientId: true },
        }).then((r) => r.length),
      ]);

    return {
      todayAppointments,
      todayAttended,
      todayPending,
      weekAppointments,
      monthlyAppointments,
      uniquePatients,
    };
  }

  async getOwnerTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { locales: true, dentists: true, patients: true } },
      },
    });

    if (!tenant) return null;

    const subscription = tenant.subscriptions[0] || null;

    return {
      id: tenant.id,
      name: tenant.name,
      rut: tenant.rut,
      businessName: tenant.businessName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      themeColor: tenant.themeColor,
      planType: tenant.planType,
      subscription: subscription ? {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        maxLocales: subscription.maxLocales,
        maxDentists: subscription.maxDentists,
        maxPatients: subscription.maxPatients,
        features: subscription.features as any,
        startsAt: subscription.createdAt,
        expiresAt: subscription.expiresAt,
        autoRenew: subscription.autoRenew,
      } : null,
      usage: {
        locales: tenant._count.locales,
        dentists: tenant._count.dentists,
        patients: tenant._count.patients,
      },
    };
  }

  async updateOwnerTenant(tenantId: string, dto: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name,
        businessName: dto.businessName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        themeColor: dto.themeColor,
      },
    });
  }

  async getAdminSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        tenant: { select: { id: true, name: true, rut: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAdminAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getAdminSettings() {
    const settings = await this.prisma.globalSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = JSON.stringify(s.value);
    }
    return map;
  }

  async updateAdminSettings(dto: Record<string, string>) {
    for (const [key, value] of Object.entries(dto)) {
      await this.prisma.globalSetting.upsert({
        where: { key },
        update: { value: this.parseSettingValue(value) },
        create: { key, value: this.parseSettingValue(value), updatedBy: "system" },
      });
    }
    return { message: "Configuración actualizada" };
  }

  private parseSettingValue(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
