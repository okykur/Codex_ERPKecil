import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CompaniesService } from "./companies.service";

@UseGuards(JwtAuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@Query("includeInactive") includeInactive?: string) {
    return this.companiesService.findAll(includeInactive === "true");
  }

  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.companiesService.create(body, request.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.companiesService.update(id, body, request.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.companiesService.remove(id, request.user);
  }
}
