import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(@Query("companyId") companyId?: string, @Query("search") search?: string) {
    return this.purchaseOrdersService.findAll({ companyId, search });
  }

  @UseGuards(JwtAuthGuard)
  @Get("eligible-purchase-requests")
  eligiblePurchaseRequests(@Req() request: { user: AuthenticatedUser }) {
    return this.purchaseOrdersService.eligiblePurchaseRequests(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.purchaseOrdersService.create(body, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.purchaseOrdersService.update(id, body, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/cancel")
  cancel(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.purchaseOrdersService.cancel(id, request.user);
  }
}
