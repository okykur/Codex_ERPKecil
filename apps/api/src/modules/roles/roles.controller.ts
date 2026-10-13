import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesService } from "./roles.service";

@UseGuards(JwtAuthGuard)
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.rolesService.create(body, request.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.rolesService.update(id, body, request.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.rolesService.remove(id, request.user);
  }
}
