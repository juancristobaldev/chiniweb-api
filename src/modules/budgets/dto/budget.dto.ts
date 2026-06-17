import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class BudgetItemDto {
  @IsOptional()
  @IsNumber()
  toothCode?: number;

  @IsString()
  procedure: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateBudgetDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  localeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items: BudgetItemDto[];
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
