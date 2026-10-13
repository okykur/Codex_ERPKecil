import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PurchaseRequest, PurchaseRequestItem } from "../../database/entities/erp.entities";
import { PurchaseRequestsController } from "./purchase-requests.controller";
import { PurchaseRequestsService } from "./purchase-requests.service";

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseRequest, PurchaseRequestItem])],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService]
})
export class PurchaseRequestsModule {}
