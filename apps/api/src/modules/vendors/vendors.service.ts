import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vendor } from "../../database/entities/erp.entities";

@Injectable()
export class VendorsService {
  constructor(@InjectRepository(Vendor) private readonly vendors: Repository<Vendor>) {}

  findAll(companyId?: string) {
    return this.vendors.find({
      where: companyId ? { company: { id: companyId } } : {},
      relations: { company: true },
      order: { code: "ASC" }
    });
  }
}
