import { IsString, IsOptional, IsDateString, IsUUID, IsEnum, MinLength } from "class-validator";
import { AppointmentStatus } from "@prisma/client";

export class CreateAppointmentDto {
  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  localeId: string;

  @IsOptional()
  @IsUUID()
  boxId?: string;

  @IsOptional()
  @IsUUID()
  treatmentPlanId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  localeId?: string;

  @IsOptional()
  @IsUUID()
  boxId?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AppointmentQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  view?: "day" | "week" | "month";

  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  localeId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
