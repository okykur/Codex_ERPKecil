import { Controller, Get, Query } from "@nestjs/common";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@Query("includeInactive") includeInactive?: string) {
    return this.companiesService.findAll(includeInactive === "true");
  }
}
