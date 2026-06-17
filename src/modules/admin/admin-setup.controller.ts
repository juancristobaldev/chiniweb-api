import { Controller, Get, Query, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Public } from "../../common/decorators/public.decorator";
import * as bcrypt from "bcrypt";

@Controller()
@Public()
export class AdminSetupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("admin/setup")
  async setup(
    @Query("usuario") usuario: string,
    @Query("contraseña") contraseña: string,
  ) {
    try {
      if (!usuario || !contraseña) {
        throw new BadRequestException("Faltan parámetros: usuario y contraseña son requeridos");
      }

      const existingAdmin = await this.prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (existingAdmin) {
        throw new ConflictException("Ya existe un usuario administrador");
      }

      const passwordHash = await bcrypt.hash(contraseña, 12);

      const admin = await this.prisma.user.create({
        data: {
          email: usuario,
          passwordHash,
          firstName: "Admin",
          lastName: "Admin",
          role: "ADMIN",
        },
      });

      const { passwordHash: _, ...safe } = admin;
      return safe;
    } catch (error) {
      console.error("AdminSetup Error:", error);
      throw error;
    }
  }
}
