import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min, MinLength } from "class-validator";
import { PaymentMethod } from "@prisma/client";

export class CreatePaymentDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
