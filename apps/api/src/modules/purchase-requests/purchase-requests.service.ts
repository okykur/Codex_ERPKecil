import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Like, Repository } from "typeorm";
import {
  ApprovalStep,
  Company,
  PurchaseOrder,
  PurchaseRequest,
  PurchaseRequestItem,
  User
} from "../../database/entities/erp.entities";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type PurchaseRequestQuery = {
  companyId?: string;
  search?: string;
};

type LineInput = {
  id?: string;
  code?: string;
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  category?: string;
  warehouse?: string;
};

type ApprovalInput = {
  approverName?: string;
  approverPosition?: string;
  approverEmail?: string;
};

type PurchaseRequestInput = {
  title?: string;
  description?: string;
  department?: string;
  priority?: string;
  items?: LineInput[];
  approvals?: ApprovalInput[];
};

@Injectable()
export class PurchaseRequestsService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PurchaseRequest) private readonly purchaseRequests: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseRequestItem) private readonly items: Repository<PurchaseRequestItem>,
    @InjectRepository(ApprovalStep) private readonly approvals: Repository<ApprovalStep>,
    @InjectRepository(PurchaseOrder) private readonly purchaseOrders: Repository<PurchaseOrder>
  ) {}

  findAll(query: PurchaseRequestQuery) {
    return this.purchaseRequests.find({
      where: {
        ...(query.companyId ? { company: { id: query.companyId } } : {}),
        ...(query.search ? { documentNumber: ILike(`%${query.search}%`) } : {})
      },
      relations: { company: true, requester: true, items: true },
      order: { createdAt: "DESC" },
      take: 50
    });
  }

  async create(body: unknown, user: AuthenticatedUser) {
    const input = body as PurchaseRequestInput;
    if (!input.title?.trim()) {
      throw new BadRequestException("Judul PR wajib diisi.");
    }
    if (!input.items?.length) {
      throw new BadRequestException("Minimal satu item PR wajib diisi.");
    }

    const company = await this.companies.findOneByOrFail({ id: user.companyId });
    const requester = await this.users.findOneByOrFail({ id: user.sub });
    const pr = this.purchaseRequests.create({
      company,
      requester,
      documentNumber: await this.nextNumber(user.companyId, "21"),
      title: input.title.trim(),
      description: input.description,
      department: input.department,
      priority: input.priority || "Normal",
      status: "waiting_approval",
      totalAmount: this.total(input.items).toFixed(2)
    });
    const saved = await this.purchaseRequests.save(pr);

    await this.items.save(
      input.items.map((item, index) =>
        this.items.create({
          purchaseRequest: saved,
          code: item.code?.trim() || `PRV-${String(index + 1).padStart(3, "0")}`,
          name: item.name?.trim() || "Item PR",
          quantity: String(Number(item.quantity || 1)),
          unitPrice: String(Number(item.unitPrice || 0)),
          category: item.category || "Asset",
          warehouse: item.warehouse || "User Request"
        })
      )
    );
    await this.replaceApprovals(saved.id, input.approvals || []);
    return this.findOne(saved.id);
  }

  async update(id: string, body: unknown, user: AuthenticatedUser) {
    const input = body as PurchaseRequestInput;
    const pr = await this.purchaseRequests.findOne({
      where: { id, company: { id: user.companyId } },
      relations: { items: true, company: true }
    });
    if (!pr) {
      throw new NotFoundException("Purchase Request tidak ditemukan.");
    }
    if (pr.status === "approved" || pr.status === "cancelled") {
      throw new BadRequestException("PR approved/cancelled tidak bisa diubah.");
    }
    if (!input.items?.length) {
      throw new BadRequestException("Minimal satu item PR wajib diisi.");
    }

    pr.title = input.title?.trim() || pr.title;
    pr.description = input.description;
    pr.department = input.department;
    pr.priority = input.priority || "Normal";
    pr.totalAmount = this.total(input.items).toFixed(2);
    pr.status = "waiting_approval";
    await this.purchaseRequests.save(pr);

    await this.items.delete({ purchaseRequest: { id: pr.id } });
    await this.items.save(
      input.items.map((item, index) =>
        this.items.create({
          purchaseRequest: pr,
          code: item.code?.trim() || `PRV-${String(index + 1).padStart(3, "0")}`,
          name: item.name?.trim() || "Item PR",
          quantity: String(Number(item.quantity || 1)),
          unitPrice: String(Number(item.unitPrice || 0)),
          category: item.category || "Asset",
          warehouse: item.warehouse || "User Request"
        })
      )
    );
    await this.replaceApprovals(pr.id, input.approvals || []);
    return this.findOne(pr.id);
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const pr = await this.purchaseRequests.findOne({ where: { id, company: { id: user.companyId } } });
    if (!pr) {
      throw new NotFoundException("Purchase Request tidak ditemukan.");
    }
    const approvedPo = await this.purchaseOrders.count({
      where: { purchaseRequest: { id }, company: { id: user.companyId }, status: "approved" }
    });
    if (approvedPo > 0) {
      throw new BadRequestException("PR tidak bisa dicancel karena PO sudah approved.");
    }
    pr.status = "cancelled";
    return this.purchaseRequests.save(pr);
  }

  private async findOne(id: string) {
    return this.purchaseRequests.findOneOrFail({
      where: { id },
      relations: { company: true, requester: true, items: true },
      order: { items: { code: "ASC" } }
    });
  }

  private async replaceApprovals(documentId: string, approvals: ApprovalInput[]) {
    await this.approvals.delete({ documentType: "PR", documentId });
    const validApprovals = approvals.filter((approval) => approval.approverName && approval.approverEmail);
    if (!validApprovals.length) {
      return;
    }
    await this.approvals.save(
      validApprovals.map((approval) =>
        this.approvals.create({
          documentType: "PR",
          documentId,
          approverName: approval.approverName || "",
          approverPosition: approval.approverPosition || "",
          approverEmail: approval.approverEmail || "",
          status: "waiting_response"
        })
      )
    );
  }

  private total(items: LineInput[]) {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  }

  private async nextNumber(companyId: string, fixedCode: "21" | "22") {
    const yy = String(new Date().getFullYear()).slice(-2);
    const prefix = `${yy}${fixedCode}`;
    const count = await this.purchaseRequests.count({
      where: { company: { id: companyId }, documentNumber: Like(`${prefix}%`) }
    });
    return `${prefix}${String(count + 1).padStart(5, "0")}`;
  }
}
