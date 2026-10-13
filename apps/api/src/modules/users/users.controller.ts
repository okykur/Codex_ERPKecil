import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedUser, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.usersService.create(body, request.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: { user: AuthenticatedUser }) {
    return this.usersService.update(id, body, request.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: { user: AuthenticatedUser }) {
    return this.usersService.remove(id, request.user);
  }
}
