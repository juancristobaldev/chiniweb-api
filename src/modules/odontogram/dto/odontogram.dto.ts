import { IsNumber, IsString, IsOptional, IsEnum, IsArray, ValidateNested, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ToothSurface, DentalProcedure, ProcedureStatus } from "@prisma/client";

export class CreateOdontogramItemDto {
  @IsNumber()
  @Min(11)
  @Max(85)
  toothCode: number;

  @IsEnum(ToothSurface)
  surface: ToothSurface;

  @IsEnum(DentalProcedure)
  procedure: DentalProcedure;

  @IsOptional()
  @IsEnum(ProcedureStatus)
  status?: ProcedureStatus;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOdontogramItemDto {
  @IsOptional()
  @IsEnum(DentalProcedure)
  procedure?: DentalProcedure;

  @IsOptional()
  @IsEnum(ProcedureStatus)
  status?: ProcedureStatus;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchCreateOdontogramItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOdontogramItemDto)
  items: CreateOdontogramItemDto[];
}
