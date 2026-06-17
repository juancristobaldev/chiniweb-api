import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          if (req?.cookies?.access_token) {
            return req.cookies.access_token;
          }
          const authHeader = req?.headers?.authorization;
          if (authHeader?.startsWith("Bearer ")) {
            return authHeader.split(" ")[1];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  }
}
