import { Body, Controller, Delete, Get, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "../../common/enums/roles.enum";
import { AttachmentsService } from "./attachments.service";
import { CreateAttachmentDto, UpdateAttachmentDto } from "./dto/attachment.dto";

@Controller("attachments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly service: AttachmentsService) {}

  @Get("me")
  @Roles(UserRole.PATIENT)
  async findMine(@Req() req: any) {
    return this.service.findMine(req.user.id, req.user.tenantId);
  }

  @Get("patient/:patientId")
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DENTIST, UserRole.PATIENT)
  async findByPatient(@Param("patientId") patientId: string, @Req() req: any) {
    return this.service.findByPatient(patientId, req.user.tenantId, req.user);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async create(@Req() req: any, @Body() dto: CreateAttachmentDto) {
    return this.service.create(req.user.tenantId, req.user.id, dto);
  }

  @Post("upload")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  @UseInterceptors(FileInterceptor("file", { dest: "uploads" }))
  async upload(@Req() req: any, @UploadedFile() file: any, @Body() body: any) {
    return this.service.createFromUpload(req.user.tenantId, req.user.id, file, body);
  }

  @Put(":id")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateAttachmentDto) {
    return this.service.update(id, req.user.tenantId, dto);
  }

  @Delete(":id")
  @Roles(UserRole.OWNER, UserRole.DENTIST)
  async remove(@Param("id") id: string, @Req() req: any) {
    return this.service.remove(id, req.user.tenantId);
  }
}
