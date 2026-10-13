import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActiveStatus, Role } from "../../database/entities/erp.entities";
import { assertAdministrator } from "../auth/authorization";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type RoleInput = {
  id?: string;
  name?: string;
  modules?: string[];
  status?: ActiveStatus;
};

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private readonly roles: Repository<Role>) {}

  findAll() {
    return this.roles.find({ order: { name: "ASC" } });
  }

  async create(body: unknown, user: AuthenticatedUser) {
    assertAdministrator(user);
    const input = body as RoleInput;
    this.validate(input, true);
    return this.roles.save(
      this.roles.create({
        id: input.id!.trim(),
        name: input.name!.trim(),
        modules: input.modules || [],
        status: input.status || "active"
      })
    );
  }

  async update(id: string, body: unknown, user: AuthenticatedUser) {
    assertAdministrator(user);
    const role = await this.roles.findOneBy({ id });
    if (!role) {
      throw new NotFoundException("Role tidak ditemukan.");
    }
    const input = body as RoleInput;
    this.validate(input, false);
    role.name = input.name!.trim();
    role.modules = input.modules || [];
    role.status = input.status || "active";
    return this.roles.save(role);
  }

  async remove(id: string, user: AuthenticatedUser) {
    assertAdministrator(user);
    const role = await this.roles.findOneBy({ id });
    if (!role) {
      throw new NotFoundException("Role tidak ditemukan.");
    }
    role.status = "inactive";
    return this.roles.save(role);
  }

  private validate(input: RoleInput, requireId: boolean) {
    if ((requireId && !input.id?.trim()) || !input.name?.trim()) {
      throw new BadRequestException("Kode role dan nama role wajib diisi.");
    }
  }
}
