import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Like, Not, Repository } from "typeorm";
import {
  ApprovalStep,
  Company,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  RfqQuotation,
  Role,
  Vendor
} from "../../database/entities/erp.entities";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type PurchaseOrderQuery = {
  companyId?: string;
  search?: string;
};

type ApprovalInput = {
  approverName?: string;
  approverPosition?: string;
  approverEmail?: string;
};

type QuotationInput = {
  vendorId?: string;
  vendorName?: string;
  attachmentName?: string;
  selected?: boolean;
};

type PurchaseOrderInput = {
  purchaseRequestId?: string;
  vendorId?: string;
  taxPercent?: number | string;
  approvals?: ApprovalInput[];
  quotations?: QuotationInput[];
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(PurchaseRequest) private readonly purchaseRequests: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseOrder) private readonly purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private readonly items: Repository<PurchaseOrderItem>,
    @InjectRepository(RfqQuotation) private readonly quotations: Repository<RfqQuotation>,
    @InjectRepository(Vendor) private readonly vendors: Repository<Vendor>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(ApprovalStep) private readonly approvals: Repository<ApprovalStep>
  ) {}

  findAll(query: PurchaseOrderQuery) {
    return this.purchaseOrders.find({
      where: {
        ...(query.companyId ? { company: { id: query.companyId } } : {}),
        ...(query.search ? { documentNumber: ILike(`%${query.search}%`) } : {})
      },
      relations: { company: true, purchaseRequest: true, vendor: true, items: true, quotations: true },
      order: { documentNumber: "DESC" },
      take: 100
    });
  }

  async eligiblePurchaseRequests(user: AuthenticatedUser) {
    await this.assertPurchaseOrderAccess(user);
    const purchaseRequests = await this.purchaseRequests.find({
      where: { company: { id: user.companyId }, status: "approved" },
      relations: { company: true, requester: true, items: true },
      order: { createdAt: "DESC" }
    });
    const existingPurchaseOrders = await this.purchaseOrders.find({
      where: { company: { id: user.companyId }, status: Not("cancelled") },
      relations: { purchaseRequest: true }
    });
    const usedPurchaseRequestIds = new Set(existingPurchaseOrders.map((po) => po.purchaseRequest?.id).filter(Boolean));
    return purchaseRequests.filter((pr) => !usedPurchaseRequestIds.has(pr.id));
  }

  async create(body: unknown, user: AuthenticatedUser) {
    const input = body as PurchaseOrderInput;
    if (!input.purchaseRequestId) {
      throw new BadRequestException("Nomor PR wajib dipilih.");
    }
    const pr = await this.purchaseRequests.findOne({
      where: { id: input.purchaseRequestId, company: { id: user.companyId } },
      relations: { company: true, items: true }
    });
    if (!pr) {
      throw new NotFoundException("Purchase Request tidak ditemukan.");
    }
    if (pr.status !== "approved") {
      throw new BadRequestException("PO hanya bisa dibuat dari PR yang sudah approved.");
    }
    const existingPurchaseOrder = await this.purchaseOrders.count({
      where: {
        company: { id: user.companyId },
        purchaseRequest: { id: pr.id },
        status: Not("cancelled")
      }
    });
    if (existingPurchaseOrder) {
      throw new BadRequestException("Purchase Request ini sudah memiliki Purchase Order aktif.");
    }

    const vendor = input.vendorId ? await this.vendors.findOne({ where: { id: input.vendorId } }) : null;
    const taxPercent = Number(input.taxPercent || 0);
    const netAmount = pr.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const taxAmount = pr.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice) * (taxPercent / 100),
      0
    );
    const company = await this.companies.findOneByOrFail({ id: user.companyId });

    const po = await this.purchaseOrders.save(
      this.purchaseOrders.create({
        company,
        purchaseRequest: pr,
        vendor,
        documentNumber: await this.nextNumber(user.companyId),
        status: "waiting_approval",
        taxPercent: taxPercent.toFixed(2),
        netAmount: netAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: (netAmount + taxAmount).toFixed(2)
      })
    );

    await this.items.save(
      pr.items.map((item) =>
        this.items.create({
          purchaseOrder: po,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercent: taxPercent.toFixed(2)
        })
      )
    );
    await this.replaceApprovals(po.id, input.approvals || []);
    await this.replaceQuotations(po, input.quotations || [], vendor);
    return this.findOne(po.id);
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const po = await this.purchaseOrders.findOne({ where: { id, company: { id: user.companyId } } });
    if (!po) {
      throw new NotFoundException("Purchase Order tidak ditemukan.");
    }
    if (po.status !== "issued") {
      throw new BadRequestException("Cancel hanya bisa dilakukan untuk PO status PO Issued.");
    }
    po.status = "cancelled";
    return this.purchaseOrders.save(po);
  }

  private findOne(id: string) {
    return this.purchaseOrders.findOneOrFail({
      where: { id },
      relations: { company: true, purchaseRequest: true, vendor: true, items: true, quotations: true }
    });
  }

  private async replaceApprovals(documentId: string, approvals: ApprovalInput[]) {
    await this.approvals.delete({ documentType: "PO", documentId });
    const validApprovals = approvals.filter((approval) => approval.approverName && approval.approverEmail);
    if (!validApprovals.length) {
      return;
    }
    await this.approvals.save(
      validApprovals.map((approval) =>
        this.approvals.create({
          documentType: "PO",
          documentId,
          approverName: approval.approverName || "",
          approverPosition: approval.approverPosition || "",
          approverEmail: approval.approverEmail || "",
          status: "waiting_response"
        })
      )
    );
  }

  private async replaceQuotations(po: PurchaseOrder, quotations: QuotationInput[], selectedVendor: Vendor | null) {
    await this.quotations.delete({ purchaseOrder: { id: po.id } });
    const rows = quotations.length
      ? quotations
      : selectedVendor
        ? [{ vendorId: selectedVendor.id, vendorName: selectedVendor.name, selected: true }]
        : [];
    await this.quotations.save(
      rows
        .filter((quote) => quote.vendorName || quote.vendorId)
        .map((quote) =>
          this.quotations.create({
            purchaseOrder: po,
            vendor: quote.vendorId ? ({ id: quote.vendorId } as Vendor) : undefined,
            vendorName: quote.vendorName || selectedVendor?.name || "Vendor",
            attachmentName: quote.attachmentName,
            selected: Boolean(quote.selected)
          })
        )
    );
  }

  private async nextNumber(companyId: string) {
    const yy = String(new Date().getFullYear()).slice(-2);
    const prefix = `${yy}22`;
    const count = await this.purchaseOrders.count({
      where: { company: { id: companyId }, documentNumber: Like(`${prefix}%`) }
    });
    return `${prefix}${String(count + 1).padStart(5, "0")}`;
  }

  private async assertPurchaseOrderAccess(user: AuthenticatedUser) {
    if (user.roles.includes("administrator")) {
      return;
    }
    const roles = await this.roles.findByIds(user.roles);
    const canAccessPurchaseOrders = roles.some(
      (role) => role.status === "active" && role.modules.includes("purchase-order")
    );
    if (!canAccessPurchaseOrders) {
      throw new ForbiddenException("Role tidak memiliki akses ke modul Purchase Order.");
    }
  }
}
