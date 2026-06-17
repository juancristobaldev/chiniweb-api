import { IsString, IsOptional, IsBoolean, IsObject, MinLength } from "class-validator";

export class CreateLocaleDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, { open: string; close: string }>;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateLocaleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, { open: string; close: string }>;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBoxDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateBoxDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSpecialtyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
