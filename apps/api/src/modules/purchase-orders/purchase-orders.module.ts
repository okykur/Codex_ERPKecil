import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ApprovalStep,
  Company,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  RfqQuotation,
  Vendor
} from "../../database/entities/erp.entities";
import { AuthModule } from "../auth/auth.module";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Company,
      PurchaseRequest,
      PurchaseOrder,
      PurchaseOrderItem,
      RfqQuotation,
      Vendor,
      ApprovalStep
    ])
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService]
})
export class PurchaseOrdersModule {}
