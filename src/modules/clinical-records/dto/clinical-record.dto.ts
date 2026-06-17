import { IsString, IsOptional, IsUUID, IsEnum, IsObject } from "class-validator";
import { ClinicalRecordType } from "@prisma/client";

export class CreateClinicalRecordDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsEnum(ClinicalRecordType)
  type: ClinicalRecordType;

  @IsObject()
  content: Record<string, any>;
}

export class UpdateClinicalRecordDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
