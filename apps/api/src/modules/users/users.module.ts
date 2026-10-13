import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company, Role, User } from "../../database/entities/erp.entities";
import { AuthModule } from "../auth/auth.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Company, Role])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
