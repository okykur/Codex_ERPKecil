import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "../../database/entities/erp.entities";

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private readonly companies: Repository<Company>) {}

  findAll(includeInactive = false) {
    return this.companies.find({
      where: includeInactive ? {} : { status: "active" },
      order: { code: "ASC" }
    });
  }
}
