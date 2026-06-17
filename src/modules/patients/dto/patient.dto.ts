import { IsString, IsOptional, IsEmail, IsBoolean, IsDateString, IsUUID, IsArray, MinLength } from "class-validator";

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  referredBy?: string;

  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  localeIds?: string[];
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  referredBy?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  localeIds?: string[];

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class PatientQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MedicalInfoDto {
  diseases?: string[];
  allergies?: string[];
  medications?: string[];
  surgeries?: string[];
  clinicalRisks?: string[];
  familyHistory?: string[];
  habits?: string[];
}
