import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto, MedicalInfoDto } from "./dto/patient.dto";
import { UserRole } from "../../common/enums/roles.enum";

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string | undefined, query?: PatientQueryDto) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { rut: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query?.rut) {
      where.rut = { contains: query.rut };
    }

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const patients = await this.prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, isActive: true,
          },
        },
        locales: {
          include: {
            locale: { select: { id: true, name: true } },
          },
        },
        dentist: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: {
          select: {
            appointments: true,
            treatmentPlans: true,
            budgets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return patients.map((p) => ({
      ...p,
      displayName: `${p.firstName || p.user?.firstName || ""} ${p.lastName || p.user?.lastName || ""}`.trim(),
    }));
  }

  async getPatientByUserId(userId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId, tenantId },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, isActive: true,
          },
        },
        medicalInfo: true,
        dentist: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        locales: {
          include: { locale: { select: { id: true, name: true } } },
        },
        _count: {
          select: { appointments: true, treatmentPlans: true, budgets: true, payments: true },
        },
      },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return patient;
  }

  async findById(id: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, isActive: true, lastLogin: true,
          },
        },
        medicalInfo: true,
        dentist: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        locales: {
          include: {
            locale: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            appointments: true,
            treatmentPlans: true,
            budgets: true,
            payments: true,
          },
        },
      },
    });
    if (!patient) throw new NotFoundException("Paciente no encontrado");
    return patient;
  }

  async create(tenantId: string, dto: CreatePatientDto, user?: any) {
    if (dto.rut) {
      const existing = await this.prisma.patient.findFirst({
        where: { tenantId, rut: dto.rut },
      });
      if (existing) throw new ConflictException("Ya existe un paciente con ese RUT");
    }

    let dentistId = dto.dentistId;

    if (user?.role === UserRole.DENTIST) {
      const dentist = await this.prisma.dentist.findFirst({
        where: { userId: user.id, tenantId },
        select: { id: true },
      });
      if (!dentist) throw new NotFoundException("Dentista no encontrado");
      dentistId = dentist.id;
    }

    await this.validateTenantReferences(tenantId, dentistId, dto.localeIds);

    let userId: string | null = null;

    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!existingUser) {
        const tempPassword = await bcrypt.hash(`tmp-${crypto.randomUUID()}`, 12);
        const user = await this.prisma.user.create({
          data: {
            email: dto.email,
            passwordHash: tempPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            role: "PATIENT",
            tenantId,
          },
        });
        userId = user.id;
      } else {
        userId = existingUser.id;
      }
    }

    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        userId,
        rut: dto.rut,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: dto.dob ? new Date(dto.dob) : null,
        sex: dto.sex,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
        bloodType: dto.bloodType,
        occupation: dto.occupation,
        referredBy: dto.referredBy,
        dentistId,
      },
    });

    if (dto.localeIds?.length) {
      for (const localeId of dto.localeIds) {
        await this.prisma.patientLocale.create({
          data: { patientId: patient.id, localeId },
        });
      }
    }

    await this.prisma.medicalInfo.create({
      data: { patientId: patient.id },
    });

    return this.findById(patient.id, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdatePatientDto) {
    await this.findById(id, tenantId);
    await this.validateTenantReferences(tenantId, dto.dentistId, dto.localeIds);

    const patientUpdate: any = {};
    if (dto.dob) patientUpdate.dob = new Date(dto.dob);

    const patientFields = ["rut", "sex", "address", "emergencyContact", "emergencyPhone", "bloodType", "occupation", "referredBy", "isActive", "dentistId"];
    for (const field of patientFields) {
      if (dto[field] !== undefined) patientUpdate[field] = dto[field];
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: patientUpdate,
    });

    if (dto.localeIds !== undefined) {
      await this.prisma.patientLocale.deleteMany({ where: { patientId: id } });
      for (const localeId of dto.localeIds) {
        await this.prisma.patientLocale.create({
          data: { patientId: id, localeId },
        });
      }
    }

    if (dto.firstName || dto.lastName || dto.phone || dto.password) {
      const userUpdate: any = {};
      if (dto.firstName) userUpdate.firstName = dto.firstName;
      if (dto.lastName) userUpdate.lastName = dto.lastName;
      if (dto.phone) userUpdate.phone = dto.phone;
      if (dto.password) userUpdate.passwordHash = await bcrypt.hash(dto.password, 12);

      if (patient.userId) {
        await this.prisma.user.update({
          where: { id: patient.userId },
          data: userUpdate,
        });
      } else {
        await this.prisma.patient.update({
          where: { id },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
      }
    }

    return this.findById(id, tenantId);
  }

  async updateByUserId(userId: string, tenantId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findFirst({ where: { userId, tenantId } });
    if (!patient) throw new NotFoundException("Paciente no encontrado");

    const safeDto: UpdatePatientDto = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      dob: dto.dob,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      occupation: dto.occupation,
    };

    return this.update(patient.id, tenantId, safeDto);
  }

  async updateMedicalInfo(id: string, tenantId: string, dto: MedicalInfoDto) {
    await this.findById(id, tenantId);
    return this.prisma.medicalInfo.update({
      where: { patientId: id },
      data: {
        diseases: dto.diseases || [],
        allergies: dto.allergies || [],
        medications: dto.medications || [],
        surgeries: dto.surgeries || [],
        clinicalRisks: dto.clinicalRisks || [],
        familyHistory: dto.familyHistory || [],
        habits: dto.habits || [],
      },
    });
  }

  async getHistory(id: string, tenantId: string) {
    const patient = await this.findById(id, tenantId);

    const [appointments, clinicalRecords, treatmentPlans, budgets, payments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId: id, tenantId },
        orderBy: { startTime: "desc" },
        include: {
          dentist: {
            select: { id: true, firstName: true, lastName: true },
          },
          locale: {
            select: { id: true, name: true },
          },
        },
        take: 50,
      }),
      this.prisma.clinicalRecord.findMany({
        where: { patientId: id, isDeleted: false },
        orderBy: { createdAt: "desc" },
        include: {
          dentist: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        take: 50,
      }),
      this.prisma.treatmentPlan.findMany({
        where: { patientId: id },
        orderBy: { createdAt: "desc" },
        include: {
          stages: { orderBy: { step: "asc" } },
        },
      }),
      this.prisma.budget.findMany({
        where: { patientId: id, tenantId },
        orderBy: { createdAt: "desc" },
        include: { items: true },
        take: 20,
      }),
      this.prisma.payment.findMany({
        where: { patientId: id, tenantId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      patient,
      appointments,
      clinicalRecords,
      treatmentPlans,
      budgets,
      payments,
    };
  }

  private async validateTenantReferences(tenantId: string, dentistId?: string, localeIds?: string[]) {
    if (dentistId) {
      const dentist = await this.prisma.dentist.findFirst({ where: { id: dentistId, tenantId } });
      if (!dentist) throw new NotFoundException("Dentista no encontrado");
    }

    if (localeIds?.length) {
      const count = await this.prisma.locale.count({ where: { id: { in: localeIds }, tenantId } });
      if (count !== localeIds.length) throw new NotFoundException("Uno o más locales no existen");
    }
  }
}
