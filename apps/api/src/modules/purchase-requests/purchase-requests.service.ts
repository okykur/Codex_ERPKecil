import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { PurchaseRequest } from "../../database/entities/erp.entities";

type PurchaseRequestQuery = {
  companyId?: string;
  search?: string;
};

@Injectable()
export class PurchaseRequestsService {
  constructor(@InjectRepository(PurchaseRequest) private readonly purchaseRequests: Repository<PurchaseRequest>) {}

  findAll(query: PurchaseRequestQuery) {
    return this.purchaseRequests.find({
      where: {
        ...(query.companyId ? { company: { id: query.companyId } } : {}),
        ...(query.search ? { documentNumber: ILike(`%${query.search}%`) } : {})
      },
      relations: { company: true, requester: true, items: true },
      order: { createdAt: "DESC" },
      take: 50
    });
  }
}
