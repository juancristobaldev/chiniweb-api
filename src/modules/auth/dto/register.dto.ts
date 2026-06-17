import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Debe ingresar un email válido" })
  email: string;

  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: "Debe ingresar un email válido" })
  email: string;

  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
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
}

export class RegisterOwnerDto {
  @IsString()
  @MinLength(2)
  clinicName: string;

  @IsString()
  @MinLength(7)
  @MaxLength(12)
  rut: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsEmail({}, { message: "Debe ingresar un email válido" })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password: string;

  @IsOptional()
  @IsString()
  themeColor?: string;
}
