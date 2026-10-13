import { Controller, Get, Query } from "@nestjs/common";
import { VendorsService } from "./vendors.service";

@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll(@Query("companyId") companyId?: string) {
    return this.vendorsService.findAll(companyId);
  }
}
