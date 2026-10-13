import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApprovalStep, PurchaseOrder, PurchaseRequest } from "../../database/entities/erp.entities";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type ApprovalQuery = {
  context?: "PR" | "PO";
};

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(ApprovalStep) private readonly approvals: Repository<ApprovalStep>,
    @InjectRepository(PurchaseRequest) private readonly purchaseRequests: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseOrder) private readonly purchaseOrders: Repository<PurchaseOrder>
  ) {}

  async findAll(query: ApprovalQuery, user: AuthenticatedUser) {
    const approvals = await this.approvals.find({
      where: query.context ? { documentType: query.context } : {},
      order: { documentType: "ASC", approverName: "ASC" }
    });
    const rows = await Promise.all(
      approvals.map(async (approval) => {
        const document = await this.documentFor(approval.documentType, approval.documentId);
        if (!document || document.company.id !== user.companyId) {
          return null;
        }
        return {
          ...approval,
          documentNumber: document.documentNumber,
          documentTitle: "title" in document ? document.title : document.purchaseRequest?.title,
          documentStatus: document.status,
          company: document.company
        };
      })
    );
    return rows.filter(Boolean);
  }

  async action(id: string, action: "approved" | "rejected", user: AuthenticatedUser) {
    if (!["approved", "rejected"].includes(action)) {
      throw new BadRequestException("Action approval tidak valid.");
    }
    const approval = await this.approvals.findOneBy({ id });
    if (!approval) {
      throw new NotFoundException("Approval tidak ditemukan.");
    }
    const document = await this.documentFor(approval.documentType, approval.documentId);
    if (!document || document.company.id !== user.companyId) {
      throw new NotFoundException("Dokumen approval tidak ditemukan.");
    }

    approval.status = action;
    await this.approvals.save(approval);
    await this.syncDocumentStatus(approval.documentType, approval.documentId);
    return { ...approval, message: action === "approved" ? "Approval disetujui." : "Approval ditolak." };
  }

  async resend(id: string, user: AuthenticatedUser) {
    const approval = await this.approvals.findOneBy({ id });
    if (!approval) {
      throw new NotFoundException("Approval tidak ditemukan.");
    }
    const document = await this.documentFor(approval.documentType, approval.documentId);
    if (!document || document.company.id !== user.companyId) {
      throw new NotFoundException("Dokumen approval tidak ditemukan.");
    }
    return { ...approval, message: `Email approval disiapkan ulang untuk ${approval.approverEmail}.` };
  }

  private async syncDocumentStatus(documentType: "PR" | "PO", documentId: string) {
    const approvals = await this.approvals.find({ where: { documentType, documentId } });
    const hasRejected = approvals.some((approval) => approval.status === "rejected");
    const allApproved = approvals.length > 0 && approvals.every((approval) => approval.status === "approved");

    if (documentType === "PR") {
      const pr = await this.purchaseRequests.findOneByOrFail({ id: documentId });
      pr.status = hasRejected ? "rejected" : allApproved ? "approved" : "waiting_approval";
      await this.purchaseRequests.save(pr);
      return;
    }

    const po = await this.purchaseOrders.findOneByOrFail({ id: documentId });
    po.status = hasRejected ? "rejected" : allApproved ? "issued" : "waiting_approval";
    await this.purchaseOrders.save(po);
  }

  private async documentFor(documentType: "PR" | "PO", documentId: string) {
    if (documentType === "PR") {
      return this.purchaseRequests.findOne({ where: { id: documentId }, relations: { company: true } });
    }
    return this.purchaseOrders.findOne({
      where: { id: documentId },
      relations: { company: true, purchaseRequest: true }
    });
  }
}
