import { UnauthorizedException } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { User } from "../../database/entities/erp.entities";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, password: string, companyId: string) {
    const user = await this.users.findOne({
      where: { email: email.toLowerCase(), status: "active" },
      relations: { companies: true, roles: true }
    });

    if (!user) {
      throw new UnauthorizedException("Email atau password tidak valid.");
    }

    const passwordMatches = user.passwordHash.startsWith("$2") && (await bcrypt.compare(password, user.passwordHash));

    if (!passwordMatches) {
      throw new UnauthorizedException("Email atau password tidak valid.");
    }

    const selectedCompany = user.companies.find((company) => company.id === companyId && company.status === "active");
    if (!selectedCompany) {
      throw new UnauthorizedException("User tidak memiliki akses ke company aktif yang dipilih.");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: selectedCompany.id,
      roles: user.roles.map((role) => role.id)
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles
      },
      activeCompany: selectedCompany,
      companies: user.companies
    };
  }

  async companiesForEmail(email: string) {
    const user = await this.users.findOne({
      where: { email: email.toLowerCase(), status: "active" },
      relations: { companies: true }
    });

    if (!user) {
      return [];
    }

    return user.companies.filter((company) => company.status === "active");
  }
}
