import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { IsEmail, IsString } from "class-validator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  companyId!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("companies")
  companies(@Query("email") email: string) {
    return this.authService.companiesForEmail(email);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password, body.companyId);
  }
}
