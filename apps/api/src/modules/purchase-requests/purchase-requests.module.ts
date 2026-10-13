import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ApprovalStep,
  Company,
  PurchaseOrder,
  PurchaseRequest,
  PurchaseRequestItem,
  User
} from "../../database/entities/erp.entities";
import { AuthModule } from "../auth/auth.module";
import { PurchaseRequestsController } from "./purchase-requests.controller";
import { PurchaseRequestsService } from "./purchase-requests.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Company, User, PurchaseRequest, PurchaseRequestItem, ApprovalStep, PurchaseOrder])],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService]
})
export class PurchaseRequestsModule {}
