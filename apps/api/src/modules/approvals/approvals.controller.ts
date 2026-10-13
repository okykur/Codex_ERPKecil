import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApprovalsService } from "./approvals.service";

@UseGuards(JwtAuthGuard)
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findAll(
    @Query("companyId") _companyId: string | undefined,
    @Query("context") context: "PR" | "PO" | undefined,
    @Req() request: { user: AuthenticatedUser }
  ) {
    return this.approvalsService.findAll({ context }, request.user);
  }

  @Post(":id/action")
  action(
    @Param("id") id: string,
    @Body() body: { action?: "approved" | "rejected" },
    @Req() request: { user: AuthenticatedUser }
  ) {
    return this.approvalsService.action(id, body.action || "approved", request.user);
  }

  @Post(":id/resend")
  resend(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.approvalsService.resend(id, request.user);
  }
}
