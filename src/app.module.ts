import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { LocalesModule } from "./modules/locales/locales.module";
import { DentistsModule } from "./modules/dentists/dentists.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { ClinicalRecordsModule } from "./modules/clinical-records/clinical-records.module";
import { OdontogramModule } from "./modules/odontogram/odontogram.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { TreatmentsModule } from "./modules/treatments/treatments.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { TenantGuard } from "./common/guards/tenant.guard";
import { TenantInterceptor } from "./common/interceptors/tenant.interceptor";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    LocalesModule,
    DentistsModule,
    PatientsModule,
    AppointmentsModule,
    ClinicalRecordsModule,
    OdontogramModule,
    DashboardModule,
    TreatmentsModule,
    BudgetsModule,
    PaymentsModule,
    AttachmentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
