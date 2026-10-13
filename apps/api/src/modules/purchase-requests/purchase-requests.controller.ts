import { Controller, Get, Query } from "@nestjs/common";
import { PurchaseRequestsService } from "./purchase-requests.service";

@Controller("purchase-requests")
export class PurchaseRequestsController {
  constructor(private readonly purchaseRequestsService: PurchaseRequestsService) {}

  @Get()
  findAll(@Query("companyId") companyId?: string, @Query("search") search?: string) {
    return this.purchaseRequestsService.findAll({ companyId, search });
  }
}
