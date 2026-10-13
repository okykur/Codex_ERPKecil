import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReceivesService } from "./receives.service";

@UseGuards(JwtAuthGuard)
@Controller("receives")
export class ReceivesController {
  constructor(private readonly receivesService: ReceivesService) {}

  @Get("purchase-orders")
  purchaseOrders(@Req() request: { user: AuthenticatedUser }) {
    return this.receivesService.purchaseOrdersForReceive(request.user);
  }

  @Get()
  findAll(@Req() request: { user: AuthenticatedUser }) {
    return this.receivesService.findAll(request.user);
  }

  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.receivesService.create(body, request.user);
  }
}
