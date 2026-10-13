import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, AuthenticatedUser } from "../auth/jwt-auth.guard";
import { PurchaseRequestsService } from "./purchase-requests.service";

@Controller("purchase-requests")
export class PurchaseRequestsController {
  constructor(private readonly purchaseRequestsService: PurchaseRequestsService) {}

  @Get()
  findAll(@Query("companyId") companyId?: string, @Query("search") search?: string) {
    return this.purchaseRequestsService.findAll({ companyId, search });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.purchaseRequestsService.create(body, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.purchaseRequestsService.update(id, body, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel")
  cancel(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.purchaseRequestsService.cancel(id, request.user);
  }
}
