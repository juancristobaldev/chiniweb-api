import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as nodemailer from "nodemailer";
import { v4 as uuid } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./strategies/jwt.strategy";
import { UserRole } from "../../common/enums/roles.enum";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: { select: { id: true, name: true, isActive: true, themeColor: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Email/contraseña incorrecta");
    }

    if (user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException("La clínica asociada está suspendida");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Email/contraseña incorrecta");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser({ ...user, themeColor: user.tenant?.themeColor }),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async registerOwner(dto: RegisterDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new UnauthorizedException("El email ya está registrado");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.OWNER,
        tenantId,
      },
    });

    return this.sanitizeUser(user);
  }

  async registerDentist(dto: RegisterDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new UnauthorizedException("El email ya está registrado");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.DENTIST,
        tenantId,
      },
    });

    await this.prisma.dentist.create({
      data: { userId: user.id, tenantId },
    });

    return this.sanitizeUser(user);
  }

  async refreshAccessToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token inválido o expirado");
    }
    if (stored.token.startsWith("reset:")) {
      throw new UnauthorizedException("Refresh token inválido o expirado");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { tenant: { select: { id: true, isActive: true, themeColor: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuario inactivo");
    }
    if (user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException("La clínica asociada está suspendida");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser({ ...user, themeColor: user.tenant?.themeColor }),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: { select: { id: true, name: true, isActive: true, themeColor: true } } },
    });
    if (!user) throw new UnauthorizedException("Usuario no encontrado");
    return this.sanitizeUser({ ...user, themeColor: user.tenant?.themeColor });
  }

  async getPatientDashboard(userId: string, tenantId: string, firstName?: string, lastName?: string) {
    let patient = await this.prisma.patient.findFirst({
      where: { userId },
    });

    if (!patient && firstName && lastName) {
      patient = await this.prisma.patient.findFirst({
        where: { tenantId, firstName, lastName, userId: null },
        orderBy: { createdAt: "desc" },
      });
      if (patient) {
        await this.prisma.patient.update({
          where: { id: patient.id },
          data: { userId },
        });
      }
    }

    if (!patient) {
      return { upcomingAppointments: 0, activeTreatments: 0, pendingBudgets: 0, recentAppointments: [] };
    }

    const now = new Date();

    const [upcomingAppointments, activeTreatments, pendingBudgets, recentAppointments] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            patientId: patient.id,
            startTime: { gte: now },
            status: { notIn: ["CANCELADA", "NO_ASISTIO"] },
          },
        }),
        this.prisma.treatmentPlan.count({
          where: {
            patientId: patient.id,
            status: { in: ["PLANIFICADO", "EN_PROGRESO"] },
          },
        }),
        this.prisma.budget.count({
          where: {
            patientId: patient.id,
            status: { in: ["BORRADOR", "ENVIADO"] },
          },
        }),
        this.prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            startTime: { gte: now },
            status: { notIn: ["CANCELADA", "NO_ASISTIO"] },
          },
          include: {
            dentist: {
              select: { firstName: true, lastName: true },
            },
            locale: {
              select: { name: true },
            },
          },
          orderBy: { startTime: "asc" },
          take: 5,
        }),
      ]);

    return {
      upcomingAppointments,
      activeTreatments,
      pendingBudgets,
      recentAppointments: recentAppointments.map((a) => ({
        id: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        type: a.type,
        dentistName: `${a.dentist.firstName} ${a.dentist.lastName}`,
        localeName: a.locale.name,
      })),
    };
  }

  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuid();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshTokenHash, tenant, ...safe } = user;
    if (tenant?.themeColor) safe.themeColor = tenant.themeColor;
    return safe;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: "Si el email está registrado, recibirás un enlace de recuperación." };
    }

    const resetToken = `reset:${uuid()}`;
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.sendPasswordResetEmail(user.email, resetUrl);

    if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
      return { message: "Si el email está registrado, recibirás un enlace de recuperación.", resetUrl };
    }

    return { message: "Si el email está registrado, recibirás un enlace de recuperación." };
  }

  async resetPassword(token: string, newPassword: string) {
    const entry = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!entry || entry.revoked || !entry.token.startsWith("reset:") || entry.expiresAt < new Date()) {
      if (entry) await this.prisma.refreshToken.update({ where: { id: entry.id }, data: { revoked: true } });
      throw new UnauthorizedException("Token inválido o expirado");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: entry.userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.update({ where: { id: entry.id }, data: { revoked: true } });

    return { message: "Contraseña restablecida exitosamente" };
  }

  private async sendPasswordResetEmail(email: string, resetUrl: string) {
    if (!process.env.SMTP_HOST) return;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@chinident.com",
      to: email,
      subject: "Recupera tu contraseña",
      text: `Usa este enlace para recuperar tu contraseña: ${resetUrl}`,
      html: `<p>Usa este enlace para recuperar tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }
}
