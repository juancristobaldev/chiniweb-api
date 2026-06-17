import { IsString, IsInt, IsArray, IsOptional, Min, Max, IsIn } from "class-validator";

export class CreateRecordDto {
  @IsInt()
  @Min(11)
  @Max(85)
  toothNumber: number;

  @IsArray()
  @IsString({ each: true })
  faces: string[];

  @IsString()
  catalogId: string;

  @IsString()
  @IsIn(["realized", "planned", "existing"])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
