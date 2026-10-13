import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../../database/entities/erp.entities";

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private readonly roles: Repository<Role>) {}

  findAll() {
    return this.roles.find({ order: { name: "ASC" } });
  }
}
