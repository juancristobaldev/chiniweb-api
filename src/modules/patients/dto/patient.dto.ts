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

  @IsString()
  @MinLength(7)
  rut: string;

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
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diseases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  surgeries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clinicalRisks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  familyHistory?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  habits?: string[];

  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsString()
  ultimaVisita?: string;

  @IsOptional()
  @IsBoolean()
  sangradoEncias?: boolean;

  @IsOptional()
  @IsBoolean()
  dolorDental?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tratamientosPrevios?: string[];
}
