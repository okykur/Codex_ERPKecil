import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../database/entities/erp.entities";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findAll() {
    const users = await this.users.find({
      relations: { companies: true, roles: true },
      order: { name: "ASC" }
    });

    return users.map(({ passwordHash, ...user }) => user);
  }
}
