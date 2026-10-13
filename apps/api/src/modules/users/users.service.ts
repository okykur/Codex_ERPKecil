import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { ActiveStatus, Company, Role, User } from "../../database/entities/erp.entities";
import { assertAdministrator } from "../auth/authorization";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type UserInput = {
  name?: string;
  email?: string;
  password?: string;
  status?: ActiveStatus;
  companyIds?: string[];
  roleIds?: string[];
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Role) private readonly roles: Repository<Role>
  ) {}

  async findAll() {
    const users = await this.users.find({
      relations: { companies: true, roles: true },
      order: { name: "ASC" }
    });

    return users.map(({ passwordHash, ...user }) => user);
  }

  async create(body: unknown, authUser: AuthenticatedUser) {
    assertAdministrator(authUser);
    const input = body as UserInput;
    this.validate(input, true);
    const user = this.users.create({
      name: input.name!.trim(),
      email: input.email!.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(input.password!, 10),
      status: input.status || "active",
      companies: await this.findCompanies(input.companyIds || []),
      roles: await this.findRoles(input.roleIds || [])
    });
    const saved = await this.users.save(user);
    return this.safeUser(saved.id);
  }

  async update(id: string, body: unknown, authUser: AuthenticatedUser) {
    assertAdministrator(authUser);
    const user = await this.users.findOne({ where: { id }, relations: { companies: true, roles: true } });
    if (!user) {
      throw new NotFoundException("User tidak ditemukan.");
    }
    const input = body as UserInput;
    this.validate(input, false);
    user.name = input.name!.trim();
    user.email = input.email!.trim().toLowerCase();
    user.status = input.status || "active";
    user.companies = await this.findCompanies(input.companyIds || []);
    user.roles = await this.findRoles(input.roleIds || []);
    if (input.password?.trim()) {
      user.passwordHash = await bcrypt.hash(input.password, 10);
    }
    await this.users.save(user);
    return this.safeUser(id);
  }

  async remove(id: string, authUser: AuthenticatedUser) {
    assertAdministrator(authUser);
    const user = await this.users.findOneBy({ id });
    if (!user) {
      throw new NotFoundException("User tidak ditemukan.");
    }
    user.status = "inactive";
    await this.users.save(user);
    return this.safeUser(id);
  }

  private async safeUser(id: string) {
    const user = await this.users.findOneOrFail({ where: { id }, relations: { companies: true, roles: true } });
    const { passwordHash, ...safe } = user;
    return safe;
  }

  private async findCompanies(ids: string[]) {
    if (!ids.length) {
      throw new BadRequestException("Minimal satu company assignment wajib dipilih.");
    }
    const companies = await this.companies.findByIds(ids);
    if (companies.length !== ids.length) {
      throw new BadRequestException("Company assignment tidak valid.");
    }
    return companies;
  }

  private async findRoles(ids: string[]) {
    if (!ids.length) {
      throw new BadRequestException("Minimal satu role wajib dipilih.");
    }
    const roles = await this.roles.findByIds(ids);
    if (roles.length !== ids.length) {
      throw new BadRequestException("Role assignment tidak valid.");
    }
    return roles;
  }

  private validate(input: UserInput, requirePassword: boolean) {
    if (!input.name?.trim() || !input.email?.trim()) {
      throw new BadRequestException("Nama dan email user wajib diisi.");
    }
    if (requirePassword && !input.password?.trim()) {
      throw new BadRequestException("Password wajib diisi untuk user baru.");
    }
  }
}
