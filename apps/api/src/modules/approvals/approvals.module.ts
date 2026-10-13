import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApprovalStep, PurchaseOrder, PurchaseRequest } from "../../database/entities/erp.entities";
import { AuthModule } from "../auth/auth.module";
import { ApprovalsController } from "./approvals.controller";
import { ApprovalsService } from "./approvals.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ApprovalStep, PurchaseRequest, PurchaseOrder])],
  controllers: [ApprovalsController],
  providers: [ApprovalsService]
})
export class ApprovalsModule {}
