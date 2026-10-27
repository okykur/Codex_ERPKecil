import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import { PurchaseOrder, Receive, ReceiveLine } from "../../database/entities/erp.entities";
import { AuthenticatedUser } from "../auth/jwt-auth.guard";

type ReceiveLineInput = {
  code?: string;
  name?: string;
  receivedQuantity?: number | string;
  receivedAmount?: number | string;
};

type ReceiveInput = {
  purchaseOrderId?: string;
  basis?: "quantity" | "amount" | "deliverable";
  handoverDocument?: string;
  lines?: ReceiveLineInput[];
};

@Injectable()
export class ReceivesService {
  constructor(
    @InjectRepository(PurchaseOrder) private readonly purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(Receive) private readonly receives: Repository<Receive>,
    @InjectRepository(ReceiveLine) private readonly receiveLines: Repository<ReceiveLine>
  ) {}

  async purchaseOrdersForReceive(user: AuthenticatedUser) {
    const orders = await this.purchaseOrders.find({
      where: { company: { id: user.companyId }, status: "issued" },
      relations: { company: true, vendor: true, purchaseRequest: true, purchaseRequests: true, items: true },
      order: { documentNumber: "DESC" }
    });
    const receives = await this.findAll(user);
    return orders.map((order) => ({
      ...order,
      receivedLines: receives
        .filter((receive) => receive.purchaseOrder.id === order.id)
        .flatMap((receive) => receive.lines || [])
    }));
  }

  findAll(user: AuthenticatedUser) {
    return this.receives.find({
      where: { purchaseOrder: { company: { id: user.companyId } } },
      relations: { purchaseOrder: true, lines: true },
      order: { documentNumber: "DESC" }
    });
  }

  async create(body: unknown, user: AuthenticatedUser) {
    const input = body as ReceiveInput;
    if (!input.purchaseOrderId) {
      throw new BadRequestException("PO wajib dipilih.");
    }
    const po = await this.purchaseOrders.findOne({
      where: { id: input.purchaseOrderId, company: { id: user.companyId } },
      relations: { company: true, items: true }
    });
    if (!po) {
      throw new NotFoundException("Purchase Order tidak ditemukan.");
    }
    if (po.status !== "issued") {
      throw new BadRequestException("Receive hanya bisa untuk PO status issued.");
    }
    if (!input.lines?.length) {
      throw new BadRequestException("Minimal satu line receive wajib diisi.");
    }

    await this.validateRemaining(po, input.lines);
    const basis = input.basis || "quantity";
    const receive = await this.receives.save(
      this.receives.create({
        purchaseOrder: po,
        documentNumber: await this.nextNumber(user.companyId),
        kind: basis === "quantity" ? "goods" : "service",
        basis,
        handoverDocument: input.handoverDocument
      })
    );
    await this.receiveLines.save(
      input.lines.map((line) => {
        const poLine = po.items.find((item) => item.code === line.code)!;
        const receivedQuantity = Number(line.receivedQuantity);
        return this.receiveLines.create({
          receive,
          code: line.code || "",
          name: poLine.name,
          receivedQuantity: receivedQuantity.toFixed(2),
          receivedAmount: (receivedQuantity * Number(poLine.unitPrice)).toFixed(2)
        });
      })
    );
    return this.receives.findOneOrFail({ where: { id: receive.id }, relations: { purchaseOrder: true, lines: true } });
  }

  private async validateRemaining(po: PurchaseOrder, lines: ReceiveLineInput[]) {
    const previousReceives = await this.receives.find({ where: { purchaseOrder: { id: po.id } }, relations: { lines: true } });
    const requestedByCode = new Map<string, number>();
    for (const line of lines) {
      const code = line.code || "";
      const quantity = Number(line.receivedQuantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Qty receive ${code} wajib lebih dari 0.`);
      }
      requestedByCode.set(code, (requestedByCode.get(code) || 0) + quantity);
    }
    for (const [code, requestedQuantity] of requestedByCode) {
      const poLine = po.items.find((item) => item.code === code);
      if (!poLine) {
        throw new BadRequestException(`Item ${code} tidak ada di PO.`);
      }
      const receivedQty = previousReceives
        .flatMap((receive) => receive.lines || [])
        .filter((receiveLine) => receiveLine.code === code)
        .reduce((sum, receiveLine) => sum + Number(receiveLine.receivedQuantity), 0);
      if (receivedQty + requestedQuantity > Number(poLine.quantity)) {
        throw new BadRequestException(`Qty receive ${code} melebihi sisa PO.`);
      }
    }
  }

  private async nextNumber(companyId: string) {
    const yy = String(new Date().getFullYear()).slice(-2);
    const prefix = `${yy}23`;
    const count = await this.receives.count({
      where: { purchaseOrder: { company: { id: companyId } }, documentNumber: Like(`${prefix}%`) }
    });
    return `${prefix}${String(count + 1).padStart(5, "0")}`;
  }
}
