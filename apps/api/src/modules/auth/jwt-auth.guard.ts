import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export type AuthenticatedUser = {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: AuthenticatedUser }>();
    const authorization = request.headers.authorization || "";
    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("Login diperlukan untuk mengakses endpoint ini.");
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthenticatedUser>(token, {
        secret: process.env.JWT_SECRET || "PLEASE_SET_JWT_SECRET"
      });
      return true;
    } catch {
      throw new UnauthorizedException("Session tidak valid atau sudah kedaluwarsa.");
    }
  }
}
