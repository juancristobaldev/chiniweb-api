import { FileEntityType, FileType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, Min, MinLength } from "class-validator";

export class CreateAttachmentDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsEnum(FileEntityType)
  entityType?: FileEntityType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  treatmentPlanId?: string;

  @IsOptional()
  @IsUUID()
  clinicalRecordId?: string;

  @IsUrl({ require_tld: false })
  fileUrl: string;

  @IsEnum(FileType)
  fileType: FileType;

  @IsString()
  @MinLength(2)
  fileName: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;
}

export class UpdateAttachmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fileName?: string;

  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @IsOptional()
  @IsUrl({ require_tld: false })
  fileUrl?: string;
}
