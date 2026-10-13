import { DataSourceOptions } from "typeorm";
import {
  ApprovalStep,
  Company,
  JournalEntry,
  JournalLine,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  PurchaseRequestItem,
  Receive,
  ReceiveLine,
  ReferenceCategory,
  ReferenceValue,
  RfqQuotation,
  Role,
  User,
  Vendor
} from "./entities/erp.entities";

export function dataSourceOptions(): DataSourceOptions {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Use the erplittle PostgreSQL connection string.");
  }

  return {
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [
      Company,
      Role,
      User,
      Vendor,
      ReferenceCategory,
      ReferenceValue,
      PurchaseRequest,
      PurchaseRequestItem,
      ApprovalStep,
      PurchaseOrder,
      PurchaseOrderItem,
      RfqQuotation,
      Receive,
      ReceiveLine,
      JournalEntry,
      JournalLine
    ],
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === "true"
  };
}
