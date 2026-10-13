import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PurchaseOrder, Receive, ReceiveLine } from "../../database/entities/erp.entities";
import { AuthModule } from "../auth/auth.module";
import { ReceivesController } from "./receives.controller";
import { ReceivesService } from "./receives.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PurchaseOrder, Receive, ReceiveLine])],
  controllers: [ReceivesController],
  providers: [ReceivesService]
})
export class ReceivesModule {}
