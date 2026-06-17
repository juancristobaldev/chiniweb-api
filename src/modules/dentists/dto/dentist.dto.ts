import { IsString, IsOptional, IsBoolean, IsEmail, MinLength, IsArray } from "class-validator";

export class CreateDentistDto {
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsArray()
  @IsString({ each: true })
  localeIds: string[];
}

export class UpdateDentistDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class AssignLocalesDto {
  @IsArray()
  @IsString({ each: true })
  localeIds: string[];
}
