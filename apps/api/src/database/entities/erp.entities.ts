import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export type ActiveStatus = "active" | "inactive";
export type DocumentStatus = "draft" | "waiting_approval" | "approved" | "rejected" | "cancelled";

@Entity("companies")
export class Company {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ default: "active" })
  status!: ActiveStatus;

  @Column({ name: "is_default", default: false })
  isDefault!: boolean;

  @Column({ type: "text", nullable: true })
  address?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

@Entity("roles")
export class Role {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "text", array: true, default: "{}" })
  modules!: string[];

  @Column({ default: "active" })
  status!: ActiveStatus;
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ default: "active" })
  status!: ActiveStatus;

  @ManyToMany(() => Company)
  @JoinTable({
    name: "user_companies",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "company_id", referencedColumnName: "id" }
  })
  companies!: Company[];

  @ManyToMany(() => Role)
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" }
  })
  roles!: Role[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

@Entity("vendors")
export class Vendor {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ name: "contact_person", nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  type!: string;

  @Column({ default: "active" })
  status!: ActiveStatus;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ type: "text", nullable: true })
  note?: string;
}

@Entity("reference_categories")
export class ReferenceCategory {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => ReferenceValue, (value) => value.category)
  values!: ReferenceValue[];
}

@Entity("reference_values")
export class ReferenceValue {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ReferenceCategory, (category) => category.values, { nullable: false })
  @JoinColumn({ name: "category_id" })
  category!: ReferenceCategory;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ default: "active" })
  status!: ActiveStatus;
}

@Entity("purchase_requests")
export class PurchaseRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "requester_id" })
  requester?: User | null;

  @Column({ name: "document_number" })
  documentNumber!: string;

  @Column()
  title!: string;

  @Column({ name: "short_description" })
  shortDescription!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  priority?: string;

  @Column({ default: "draft" })
  status!: DocumentStatus;

  @Column({ name: "total_amount", type: "numeric", precision: 18, scale: 2, default: 0 })
  totalAmount!: string;

  @OneToMany(() => PurchaseRequestItem, (item) => item.purchaseRequest)
  items!: PurchaseRequestItem[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

@Entity("purchase_request_items")
export class PurchaseRequestItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => PurchaseRequest, (pr) => pr.items, { nullable: false })
  @JoinColumn({ name: "purchase_request_id" })
  purchaseRequest!: PurchaseRequest;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ type: "numeric", precision: 18, scale: 2, default: 1 })
  quantity!: string;

  @Column({ name: "unit_price", type: "numeric", precision: 18, scale: 2, default: 0 })
  unitPrice!: string;

  @Column()
  category!: string;

  @Column({ nullable: true })
  warehouse?: string;
}

@Entity("approval_steps")
export class ApprovalStep {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "document_type" })
  documentType!: "PR" | "PO";

  @Column({ name: "document_id" })
  documentId!: string;

  @Column({ name: "approver_name" })
  approverName!: string;

  @Column({ name: "approver_position" })
  approverPosition!: string;

  @Column({ name: "approver_email" })
  approverEmail!: string;

  @Column({ default: "waiting_response" })
  status!: string;
}

@Entity("purchase_orders")
export class PurchaseOrder {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @ManyToOne(() => PurchaseRequest, { nullable: false })
  @JoinColumn({ name: "purchase_request_id" })
  purchaseRequest!: PurchaseRequest;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: "vendor_id" })
  vendor?: Vendor | null;

  @Column({ name: "document_number" })
  documentNumber!: string;

  @Column({ default: "draft" })
  status!: string;

  @Column({ name: "tax_percent", type: "numeric", precision: 8, scale: 2, default: 0 })
  taxPercent!: string;

  @Column({ name: "net_amount", type: "numeric", precision: 18, scale: 2, default: 0 })
  netAmount!: string;

  @Column({ name: "tax_amount", type: "numeric", precision: 18, scale: 2, default: 0 })
  taxAmount!: string;

  @Column({ name: "total_amount", type: "numeric", precision: 18, scale: 2, default: 0 })
  totalAmount!: string;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  items!: PurchaseOrderItem[];

  @OneToMany(() => RfqQuotation, (quotation) => quotation.purchaseOrder)
  quotations!: RfqQuotation[];
}

@Entity("purchase_order_items")
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.items, { nullable: false })
  @JoinColumn({ name: "purchase_order_id" })
  purchaseOrder!: PurchaseOrder;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ type: "numeric", precision: 18, scale: 2, default: 1 })
  quantity!: string;

  @Column({ name: "unit_price", type: "numeric", precision: 18, scale: 2, default: 0 })
  unitPrice!: string;

  @Column({ name: "tax_percent", type: "numeric", precision: 8, scale: 2, default: 0 })
  taxPercent!: string;
}

@Entity("rfq_quotations")
export class RfqQuotation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.quotations, { nullable: false })
  @JoinColumn({ name: "purchase_order_id" })
  purchaseOrder!: PurchaseOrder;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: "vendor_id" })
  vendor?: Vendor | null;

  @Column({ name: "vendor_name" })
  vendorName!: string;

  @Column({ name: "attachment_name", nullable: true })
  attachmentName?: string;

  @Column({ default: false })
  selected!: boolean;
}

@Entity("receives")
export class Receive {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => PurchaseOrder, { nullable: false })
  @JoinColumn({ name: "purchase_order_id" })
  purchaseOrder!: PurchaseOrder;

  @Column({ name: "document_number" })
  documentNumber!: string;

  @Column()
  kind!: "goods" | "service" | "mixed";

  @Column()
  basis!: "quantity" | "amount" | "deliverable";

  @Column({ name: "handover_document", nullable: true })
  handoverDocument?: string;

  @OneToMany(() => ReceiveLine, (line) => line.receive)
  lines!: ReceiveLine[];
}

@Entity("receive_lines")
export class ReceiveLine {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Receive, (receive) => receive.lines, { nullable: false })
  @JoinColumn({ name: "receive_id" })
  receive!: Receive;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ name: "received_quantity", type: "numeric", precision: 18, scale: 2, default: 0 })
  receivedQuantity!: string;

  @Column({ name: "received_amount", type: "numeric", precision: 18, scale: 2, default: 0 })
  receivedAmount!: string;
}

@Entity("journal_entries")
export class JournalEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @Column({ name: "document_number" })
  documentNumber!: string;

  @Column({ name: "source_type" })
  sourceType!: string;

  @Column({ name: "source_id" })
  sourceId!: string;
}

@Entity("journal_lines")
export class JournalLine {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => JournalEntry, { nullable: false })
  @JoinColumn({ name: "journal_entry_id" })
  journalEntry!: JournalEntry;

  @Column({ name: "coa_code" })
  coaCode!: string;

  @Column({ name: "coa_name" })
  coaName!: string;

  @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
  debit!: string;

  @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
  credit!: string;
}
