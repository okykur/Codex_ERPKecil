import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VendorsService } from "./vendors.service";

@UseGuards(JwtAuthGuard)
@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll(@Query("companyId") companyId?: string) {
    return this.vendorsService.findAll(companyId);
  }

  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.vendorsService.create(body, request.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.vendorsService.update(id, body, request.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.vendorsService.remove(id, request.user);
  }
}
