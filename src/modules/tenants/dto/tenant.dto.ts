import { IsString, IsOptional, IsEmail, IsBoolean, IsEnum, MinLength } from "class-validator";
import { PlanType } from "@prisma/client";

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  rut: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsString()
  @MinLength(6)
  ownerPassword: string;

  @IsString()
  @MinLength(2)
  ownerFirstName: string;

  @IsString()
  @MinLength(2)
  ownerLastName: string;

  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;
}
