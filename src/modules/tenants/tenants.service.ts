import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTenantDto, UpdateTenantDto } from "./dto/tenant.dto";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            lastLogin: true,
          },
        },
        _count: {
          select: {
            locales: true,
            dentists: true,
            patients: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            lastLogin: true,
          },
        },
        locales: true,
        _count: {
          select: {
            locales: true,
            dentists: true,
            patients: true,
            appointments: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!tenant) throw new NotFoundException("Clínica no encontrada");
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { rut: dto.rut },
    });
    if (existing) throw new ConflictException("Ya existe una clínica con ese RUT");

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        rut: dto.rut,
        businessName: dto.businessName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        themeColor: dto.themeColor || "blue",
        planType: dto.planType || "TRIAL",
      },
    });

    await this.prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planType: dto.planType || "TRIAL",
        maxLocales: 1,
        maxDentists: 3,
        maxPatients: 100,
        features: ["basic_agenda", "basic_clinical_records", "basic_finances"],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const ownerUser = await this.authService.registerOwner(
      {
        email: dto.email,
        password: dto.ownerPassword,
        firstName: dto.ownerFirstName,
        lastName: dto.ownerLastName,
      },
      tenant.id
    );

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { ownerId: ownerUser.id },
    });

    const updatedTenant = await this.prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        owner: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, isActive: true, lastLogin: true,
          },
        },
      },
    });

    return { tenant: updatedTenant, owner: ownerUser };
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Clínica no encontrada");

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async suspend(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Clínica no encontrada");

    await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.user.updateMany({
      where: { tenantId: id },
      data: { isActive: false },
    });

    return { message: "Clínica suspendida exitosamente" };
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalDentists,
      totalPatients,
      totalAppointments,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.dentist.count(),
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
      this.prisma.payment.aggregate({
        where: { status: "PAGADO", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalDentists,
      totalPatients,
      totalAppointments,
      monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
    };
  }

  async activate(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Clínica no encontrada");

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
