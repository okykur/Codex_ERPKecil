import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActiveStatus, Company, Vendor } from "../../database/entities/erp.entities";
import { assertAdministrator } from "../auth/authorization";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type VendorInput = {
  companyId?: string;
  code?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  type?: string;
  status?: ActiveStatus;
  address?: string;
  note?: string;
};

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor) private readonly vendors: Repository<Vendor>,
    @InjectRepository(Company) private readonly companies: Repository<Company>
  ) {}

  findAll(companyId?: string) {
    return this.vendors.find({
      where: companyId ? { company: { id: companyId } } : {},
      relations: { company: true },
      order: { code: "ASC" }
    });
  }

  async create(body: unknown, user: AuthenticatedUser) {
    assertAdministrator(user);
    const input = body as VendorInput;
    this.validate(input);
    const company = await this.companies.findOneByOrFail({ id: input.companyId || user.companyId });
    return this.vendors.save(
      this.vendors.create({
        company,
        code: input.code!.trim(),
        name: input.name!.trim(),
        contactPerson: input.contactPerson,
        email: input.email,
        type: input.type!.trim(),
        status: input.status || "active",
        address: input.address,
        note: input.note
      })
    );
  }

  async update(id: string, body: unknown, user: AuthenticatedUser) {
    assertAdministrator(user);
    const vendor = await this.vendors.findOne({ where: { id }, relations: { company: true } });
    if (!vendor) {
      throw new NotFoundException("Vendor tidak ditemukan.");
    }
    const input = body as VendorInput;
    this.validate(input);
    vendor.company = await this.companies.findOneByOrFail({ id: input.companyId || vendor.company.id });
    vendor.code = input.code!.trim();
    vendor.name = input.name!.trim();
    vendor.contactPerson = input.contactPerson;
    vendor.email = input.email;
    vendor.type = input.type!.trim();
    vendor.status = input.status || "active";
    vendor.address = input.address;
    vendor.note = input.note;
    return this.vendors.save(vendor);
  }

  async remove(id: string, user: AuthenticatedUser) {
    assertAdministrator(user);
    const vendor = await this.vendors.findOneBy({ id });
    if (!vendor) {
      throw new NotFoundException("Vendor tidak ditemukan.");
    }
    vendor.status = "inactive";
    return this.vendors.save(vendor);
  }

  private validate(input: VendorInput) {
    if (!input.code?.trim() || !input.name?.trim() || !input.type?.trim()) {
      throw new BadRequestException("Kode, nama, dan tipe vendor wajib diisi.");
    }
  }
}
