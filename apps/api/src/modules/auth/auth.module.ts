import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company, Role, User } from "../../database/entities/erp.entities";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Role]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "PLEASE_SET_JWT_SECRET",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard]
})
export class AuthModule {}
