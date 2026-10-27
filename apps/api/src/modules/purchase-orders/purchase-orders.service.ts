import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Like, Not, Repository } from "typeorm";
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

type PurchaseOrderQuery = { companyId?: string; search?: string };
type ApprovalInput = { approverName?: string; approverPosition?: string; approverEmail?: string };
type QuotationInput = {
  vendorId?: string;
  vendorName?: string;
  attachmentName?: string;
  selected?: boolean;
};
type PurchaseOrderItemInput = {
  code?: string;
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
};
type PurchaseOrderInput = {
  purchaseRequestId?: string;
  purchaseRequestIds?: string[];
  vendorId?: string;
  taxPercent?: number | string;
  shortDescription?: string;
  description?: string;
  items?: PurchaseOrderItemInput[];
  approvals?: ApprovalInput[];
  quotations?: QuotationInput[];
};
type PreparedLine = {
  code: string;
  name: string;
  quantity: string;
  unitPrice: string;
  taxPercent: string;
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
      relations: {
        company: true,
        purchaseRequest: { items: true },
        purchaseRequests: { items: true },
        vendor: true,
        items: true,
        quotations: true
      },
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
    const activeOrders = await this.purchaseOrders.find({
      where: { company: { id: user.companyId }, status: Not("cancelled") },
      relations: { purchaseRequest: true, purchaseRequests: true }
    });
    const usedIds = new Set(activeOrders.flatMap((po) => this.requestIdsForOrder(po)));
    return purchaseRequests.filter((pr) => !usedIds.has(pr.id));
  }

  async create(body: unknown, user: AuthenticatedUser) {
    await this.assertPurchaseOrderAccess(user);
    const input = body as PurchaseOrderInput;
    const requestIds = this.purchaseRequestIds(input);
    const requests = await this.loadAndValidatePurchaseRequests(requestIds, user.companyId);
    await this.assertPurchaseRequestsAvailable(requestIds, user.companyId);
    const vendor = await this.loadVendor(input.vendorId, user.companyId);
    const taxPercent = this.validateInput(input);
    const lines = this.prepareLines(input.items, requests, taxPercent);
    const totals = this.calculateTotals(lines, taxPercent);
    const company = await this.companies.findOneByOrFail({ id: user.companyId });
    const po = await this.purchaseOrders.save(
      this.purchaseOrders.create({
        company,
        purchaseRequest: requests[0],
        purchaseRequests: requests,
        vendor,
        documentNumber: await this.nextNumber(user.companyId),
        shortDescription: input.shortDescription!.trim(),
        description: input.description?.trim() || undefined,
        status: "waiting_approval",
        taxPercent: taxPercent.toFixed(2),
        netAmount: totals.netAmount.toFixed(2),
        taxAmount: totals.taxAmount.toFixed(2),
        totalAmount: totals.totalAmount.toFixed(2)
      })
    );
    await this.saveLines(po, lines);
    await this.replaceApprovals(po.id, input.approvals || []);
    await this.replaceQuotations(po, input.quotations || [], vendor);
    return this.findOne(po.id);
  }

  async update(id: string, body: unknown, user: AuthenticatedUser) {
    await this.assertPurchaseOrderAccess(user);
    const input = body as PurchaseOrderInput;
    const po = await this.purchaseOrders.findOne({
      where: { id, company: { id: user.companyId } },
      relations: { company: true, purchaseRequest: true, purchaseRequests: true, items: true }
    });
    if (!po) {
      throw new NotFoundException("Purchase Order tidak ditemukan.");
    }
    if (!["waiting_approval", "rejected"].includes(po.status)) {
      throw new BadRequestException("PO hanya dapat diubah saat menunggu approval atau setelah ditolak.");
    }
    const requestIds = this.purchaseRequestIds(input);
    const requests = await this.loadAndValidatePurchaseRequests(requestIds, user.companyId);
    await this.assertPurchaseRequestsAvailable(requestIds, user.companyId, po.id);
    const vendor = await this.loadVendor(input.vendorId, user.companyId);
    const taxPercent = this.validateInput(input);
    const lines = this.prepareLines(input.items, requests, taxPercent);
    const totals = this.calculateTotals(lines, taxPercent);

    po.purchaseRequest = requests[0];
    po.purchaseRequests = requests;
    po.vendor = vendor;
    po.shortDescription = input.shortDescription!.trim();
    po.description = input.description?.trim() || undefined;
    po.status = "waiting_approval";
    po.taxPercent = taxPercent.toFixed(2);
    po.netAmount = totals.netAmount.toFixed(2);
    po.taxAmount = totals.taxAmount.toFixed(2);
    po.totalAmount = totals.totalAmount.toFixed(2);
    await this.purchaseOrders.save(po);
    await this.items.delete({ purchaseOrder: { id: po.id } });
    await this.saveLines(po, lines);
    await this.replaceApprovals(po.id, input.approvals || []);
    await this.replaceQuotations(po, input.quotations || [], vendor);
    return this.findOne(po.id);
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const po = await this.purchaseOrders.findOne({ where: { id, company: { id: user.companyId } } });
    if (!po) {
      throw new NotFoundException("Purchase Order tidak ditemukan.");
    }
    if (!["draft", "waiting_approval"].includes(po.status)) {
      throw new BadRequestException("PO yang sudah disetujui atau ditolak tidak dapat dicancel.");
    }
    po.status = "cancelled";
    return this.purchaseOrders.save(po);
  }

  private findOne(id: string) {
    return this.purchaseOrders.findOneOrFail({
      where: { id },
      relations: {
        company: true,
        purchaseRequest: { items: true },
        purchaseRequests: { items: true },
        vendor: true,
        items: true,
        quotations: true
      }
    });
  }

  private purchaseRequestIds(input: PurchaseOrderInput) {
    const ids = input.purchaseRequestIds?.length
      ? input.purchaseRequestIds
      : input.purchaseRequestId
        ? [input.purchaseRequestId]
        : [];
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) {
      throw new BadRequestException("Minimal satu Nomor PR wajib dipilih.");
    }
    return uniqueIds;
  }

  private async loadAndValidatePurchaseRequests(ids: string[], companyId: string) {
    const requests = await this.purchaseRequests.find({
      where: { id: In(ids), company: { id: companyId } },
      relations: { company: true, requester: true, items: true }
    });
    if (requests.length !== ids.length) {
      throw new NotFoundException("Satu atau lebih Purchase Request tidak ditemukan.");
    }
    if (requests.some((pr) => pr.status !== "approved")) {
      throw new BadRequestException("PO hanya bisa dibuat dari PR yang sudah approved.");
    }
    return ids.map((id) => requests.find((pr) => pr.id === id)!);
  }

  private async assertPurchaseRequestsAvailable(ids: string[], companyId: string, currentPoId?: string) {
    const activeOrders = await this.purchaseOrders.find({
      where: { company: { id: companyId }, status: Not("cancelled") },
      relations: { purchaseRequest: true, purchaseRequests: true }
    });
    const usedIds = new Set(
      activeOrders.filter((po) => po.id !== currentPoId).flatMap((po) => this.requestIdsForOrder(po))
    );
    if (ids.some((id) => usedIds.has(id))) {
      throw new BadRequestException("Satu atau lebih Purchase Request sudah memiliki Purchase Order aktif.");
    }
  }

  private requestIdsForOrder(po: PurchaseOrder) {
    return [...new Set([po.purchaseRequest?.id, ...(po.purchaseRequests || []).map((pr) => pr.id)].filter(Boolean) as string[])];
  }

  private async loadVendor(vendorId: string | undefined, companyId: string) {
    if (!vendorId) {
      throw new BadRequestException("Vendor wajib dipilih.");
    }
    const vendor = await this.vendors.findOne({
      where: { id: vendorId, company: { id: companyId }, status: "active" }
    });
    if (!vendor) {
      throw new NotFoundException("Vendor aktif tidak ditemukan pada PT ini.");
    }
    return vendor;
  }

  private validateInput(input: PurchaseOrderInput) {
    if (!input.shortDescription?.trim()) {
      throw new BadRequestException("Short Description wajib diisi.");
    }
    const taxPercent = Number(input.taxPercent);
    if (input.taxPercent === "" || input.taxPercent === undefined || !Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      throw new BadRequestException("PPN wajib diisi dengan nilai 0 sampai 100.");
    }
    const filledApprovals = (input.approvals || []).filter(
      (approval) => approval.approverName?.trim() || approval.approverEmail?.trim() || approval.approverPosition?.trim()
    );
    if (filledApprovals.some((approval) => !approval.approverName?.trim() || !approval.approverEmail?.trim())) {
      throw new BadRequestException("Nama dan email wajib diisi untuk setiap approval.");
    }
    if (filledApprovals.some((approval) => !this.isBusinessEmail(approval.approverEmail || ""))) {
      throw new BadRequestException("Email approval wajib menggunakan email perusahaan, bukan email gratis.");
    }
    return taxPercent;
  }

  private prepareLines(items: PurchaseOrderItemInput[] | undefined, requests: PurchaseRequest[], taxPercent: number) {
    const sourceItems = new Map<string, { name: string; maxQuantity: number; unitPrice: number }>();
    requests.flatMap((pr) => pr.items || []).forEach((item) => {
      const key = this.itemKey(item.name);
      const current = sourceItems.get(key);
      sourceItems.set(key, {
        name: current?.name || item.name,
        maxQuantity: (current?.maxQuantity || 0) + Number(item.quantity),
        unitPrice: current?.unitPrice || Number(item.unitPrice)
      });
    });
    const requestedItems = items?.length
      ? items
      : [...sourceItems.values()].map((item) => ({
          name: item.name,
          quantity: item.maxQuantity,
          unitPrice: item.unitPrice
        }));
    if (!requestedItems.length) {
      throw new BadRequestException("Minimal satu item PO wajib dipilih.");
    }
    const combined = new Map<string, { name: string; quantity: number; unitPrice: number }>();
    requestedItems.forEach((item) => {
      const name = item.name?.trim() || "";
      const key = this.itemKey(name);
      const source = sourceItems.get(key);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice || 0);
      if (!name || !source) {
        throw new BadRequestException(`Item ${name || "PO"} tidak berasal dari PR yang dipilih.`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Qty item ${name} wajib lebih dari 0.`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new BadRequestException(`Harga item ${name} tidak valid.`);
      }
      const current = combined.get(key);
      combined.set(key, {
        name: source.name,
        quantity: (current?.quantity || 0) + quantity,
        unitPrice
      });
    });
    return [...combined.entries()].map(([key, item], index): PreparedLine => {
      const source = sourceItems.get(key)!;
      if (item.quantity > source.maxQuantity) {
        throw new BadRequestException(`Qty item ${item.name} melebihi total qty dari PR terpilih (${source.maxQuantity}).`);
      }
      return {
        code: `POL-${String(index + 1).padStart(3, "0")}`,
        name: item.name,
        quantity: item.quantity.toFixed(2),
        unitPrice: item.unitPrice.toFixed(2),
        taxPercent: taxPercent.toFixed(2)
      };
    });
  }

  private calculateTotals(lines: PreparedLine[], taxPercent: number) {
    const netAmount = lines.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const taxAmount = netAmount * (taxPercent / 100);
    return { netAmount, taxAmount, totalAmount: netAmount + taxAmount };
  }

  private saveLines(po: PurchaseOrder, lines: PreparedLine[]) {
    return this.items.save(lines.map((line) => this.items.create({ purchaseOrder: po, ...line })));
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
          approverPosition: "",
          approverEmail: approval.approverEmail || "",
          status: "waiting_response"
        })
      )
    );
  }

  private async replaceQuotations(po: PurchaseOrder, quotations: QuotationInput[], selectedVendor: Vendor) {
    await this.quotations.delete({ purchaseOrder: { id: po.id } });
    const rows = quotations.length
      ? quotations
      : [{ vendorId: selectedVendor.id, vendorName: selectedVendor.name, selected: true }];
    await this.quotations.save(
      rows
        .filter((quote) => quote.vendorName || quote.vendorId)
        .map((quote) =>
          this.quotations.create({
            purchaseOrder: po,
            vendor: quote.vendorId ? ({ id: quote.vendorId } as Vendor) : undefined,
            vendorName: quote.vendorName || selectedVendor.name,
            attachmentName: quote.attachmentName,
            selected: Boolean(quote.selected)
          })
        )
    );
  }

  private isBusinessEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const domain = normalized.split("@")[1] || "";
    const freeEmailDomains = new Set([
      "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.id", "ymail.com", "rocketmail.com", "hotmail.com",
      "hotmail.co.id", "outlook.com", "outlook.co.id", "live.com", "live.co.id", "msn.com", "aol.com", "icloud.com",
      "me.com", "mail.com", "protonmail.com", "proton.me", "gmx.com", "yandex.com", "mail.ru", "tutanota.com"
    ]);
    const usesFreeEmail = [...freeEmailDomains].some((freeDomain) => domain === freeDomain || domain.endsWith(`.${freeDomain}`));
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && !usesFreeEmail;
  }

  private itemKey(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
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
