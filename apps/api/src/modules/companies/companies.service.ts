import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActiveStatus, Company } from "../../database/entities/erp.entities";
import { assertAdministrator } from "../auth/authorization";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type CompanyInput = {
  code?: string;
  name?: string;
  type?: string;
  status?: ActiveStatus;
  isDefault?: boolean;
  address?: string;
};

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private readonly companies: Repository<Company>) {}

  findAll(includeInactive = false) {
    return this.companies.find({
      where: includeInactive ? {} : { status: "active" },
      order: { code: "ASC" }
    });
  }

  async create(body: unknown, user: AuthenticatedUser) {
    assertAdministrator(user);
    const input = body as CompanyInput;
    this.validate(input);
    const company = this.companies.create({
      code: input.code!.trim(),
      name: input.name!.trim(),
      type: input.type!.trim(),
      status: input.status || "active",
      isDefault: Boolean(input.isDefault),
      address: input.address
    });
    return this.companies.save(company);
  }

  async update(id: string, body: unknown, user: AuthenticatedUser) {
    assertAdministrator(user);
    const company = await this.companies.findOneBy({ id });
    if (!company) {
      throw new NotFoundException("Company tidak ditemukan.");
    }
    const input = body as CompanyInput;
    this.validate(input);
    company.code = input.code!.trim();
    company.name = input.name!.trim();
    company.type = input.type!.trim();
    company.status = input.status || "active";
    company.isDefault = Boolean(input.isDefault);
    company.address = input.address;
    return this.companies.save(company);
  }

  async remove(id: string, user: AuthenticatedUser) {
    assertAdministrator(user);
    const company = await this.companies.findOneBy({ id });
    if (!company) {
      throw new NotFoundException("Company tidak ditemukan.");
    }
    company.status = "inactive";
    return this.companies.save(company);
  }

  private validate(input: CompanyInput) {
    if (!input.code?.trim() || !input.name?.trim() || !input.type?.trim()) {
      throw new BadRequestException("Kode, nama, dan tipe company wajib diisi.");
    }
  }
}
