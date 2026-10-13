import { useEffect, useMemo, useState } from "react";
import { AppShell, MenuItem, menuItems } from "./components/AppShell";
import {
  ApprovalDraft,
  ApprovalRow,
  Company,
  PurchaseItem,
  PurchaseOrder,
  PurchaseRequest,
  Receive,
  Role,
  Session,
  User,
  Vendor,
  approvalAction,
  cancelPurchaseOrder,
  cancelPurchaseRequest,
  createPurchaseOrder,
  createReceive,
  fetchApprovals,
  fetchCompanies,
  fetchLoginCompanies,
  fetchPurchaseOrders,
  fetchPurchaseRequests,
  fetchReceivablePurchaseOrders,
  fetchReceives,
  fetchRoles,
  fetchUsers,
  fetchVendors,
  login,
  logout,
  resendApproval,
  savePurchaseRequest,
  storedSession
} from "./lib/api";
import { DashboardPage } from "./pages/DashboardPage";
import { SimpleListPage } from "./pages/SimpleListPage";

const blankItem: PurchaseItem = { code: "", name: "", quantity: "1", unitPrice: "0", category: "Asset", warehouse: "User Request" };
const blankApproval: ApprovalDraft = { approverName: "", approverPosition: "", approverEmail: "" };

export function App() {
  const [session, setSession] = useState<Session | null>(() => storedSession());
  const [activePage, setActivePage] = useState("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [receivableOrders, setReceivableOrders] = useState<PurchaseOrder[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [receives, setReceives] = useState<Receive[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const allowedMenu = useMemo(() => filterMenu(session?.user.roles || []), [session]);

  async function loadData() {
    if (!session) {
      return;
    }
    const companyId = session.activeCompany.id;
    const [companyData, userData, roleData, vendorData, prData, poData, approvalData, receivePoData, receiveData] =
      await Promise.all([
        fetchCompanies(),
        fetchUsers(),
        fetchRoles(),
        fetchVendors(companyId),
        fetchPurchaseRequests(companyId),
        fetchPurchaseOrders(companyId),
        fetchApprovals(),
        fetchReceivablePurchaseOrders(),
        fetchReceives()
      ]);
    setCompanies(companyData);
    setUsers(userData);
    setRoles(roleData);
    setVendors(vendorData);
    setPurchaseRequests(prData);
    setPurchaseOrders(poData);
    setApprovals(approvalData);
    setReceivableOrders(receivePoData);
    setReceives(receiveData);
    setError("");
  }

  useEffect(() => {
    void loadData().catch(() => setError("Data belum bisa dimuat. Pastikan session login masih aktif."));
  }, [session]);

  useEffect(() => {
    if (allowedMenu.length && !allowedMenu.some((item) => item.id === activePage)) {
      setActivePage(allowedMenu[0].id);
    }
  }, [allowedMenu, activePage]);

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  async function refreshWithNotice(message: string) {
    await loadData();
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  return (
    <AppShell
      activeCompany={session.activeCompany}
      activePage={activePage}
      allowedMenu={allowedMenu}
      onLogout={() => {
        logout();
        setSession(null);
      }}
      onNavigate={setActivePage}
      user={session.user}
    >
      {error ? <div className="alert">{error}</div> : null}
      {notice ? <div className="success">{notice}</div> : null}
      {activePage === "dashboard" ? (
        <DashboardPage
          companies={companies}
          users={users}
          vendors={vendors}
          purchaseRequests={purchaseRequests}
          purchaseOrders={purchaseOrders}
          receives={receives}
        />
      ) : null}
      {activePage === "purchase-request" ? (
        <PurchaseRequestPage
          approvals={approvals}
          onCancel={(id) => cancelPurchaseRequest(id).then(() => refreshWithNotice("Purchase Request dicancel."))}
          onSaved={() => refreshWithNotice("Purchase Request tersimpan.")}
          purchaseRequests={purchaseRequests}
        />
      ) : null}
      {activePage === "purchase-order" ? (
        <PurchaseOrderPage
          onCancel={(id) => cancelPurchaseOrder(id).then(() => refreshWithNotice("Purchase Order dicancel."))}
          onSaved={() => refreshWithNotice("Purchase Order tersimpan.")}
          purchaseOrders={purchaseOrders}
          purchaseRequests={purchaseRequests}
          vendors={vendors}
        />
      ) : null}
      {activePage === "approval" ? (
        <ApprovalPage approvals={approvals} onAction={() => refreshWithNotice("Status approval diperbarui.")} />
      ) : null}
      {activePage === "receive" ? (
        <ReceivePage onSaved={() => refreshWithNotice("Receive tersimpan.")} purchaseOrders={receivableOrders} receives={receives} />
      ) : null}
      {activePage === "company" ? (
        <SimpleListPage
          columns={[
            { header: "Kode", render: (row) => row.code },
            { header: "Nama Company", render: (row) => row.name },
            { header: "Tipe", render: (row) => row.type },
            { header: "Alamat", render: (row) => row.address || "-" },
            { header: "Status", render: (row) => <StatusBadge status={row.status} /> }
          ]}
          description="Data usaha untuk scope login dan transaksi."
          getKey={(row) => row.id}
          rows={companies}
          title="Master Company"
        />
      ) : null}
      {activePage === "users" ? (
        <SimpleListPage
          columns={[
            { header: "Nama", render: (row) => row.name },
            { header: "Email", render: (row) => row.email },
            { header: "Company", render: (row) => row.companies.map((company) => company.name).join(", ") },
            { header: "Role", render: (row) => row.roles.map((role) => role.name).join(", ") },
            { header: "Status", render: (row) => <StatusBadge status={row.status} /> }
          ]}
          description="Maintain user login, assignment company, dan role."
          getKey={(row) => row.id}
          rows={users}
          title="User Management"
        />
      ) : null}
      {activePage === "roles" ? (
        <SimpleListPage
          columns={[
            { header: "Role", render: (row) => row.name },
            { header: "Menu", render: (row) => row.modules.join(", ") },
            { header: "Status", render: (row) => <StatusBadge status={row.status} /> }
          ]}
          description="Roles menentukan menu yang tampil setelah login."
          getKey={(row) => row.id}
          rows={roles}
          title="Roles Management"
        />
      ) : null}
      {activePage === "vendors" ? (
        <SimpleListPage
          columns={[
            { header: "Kode", render: (row) => row.code },
            { header: "Nama Vendor", render: (row) => row.name },
            { header: "Tipe", render: (row) => row.type },
            { header: "Alamat", render: (row) => row.address || "-" },
            { header: "Status", render: (row) => <StatusBadge status={row.status} /> }
          ]}
          description="Vendor per company dengan alamat detail."
          getKey={(row) => row.id}
          rows={vendors}
          title="Master Vendor"
        />
      ) : null}
      {!allowedMenu.some((item) => item.id === activePage) ? <div className="panel">Menu tidak tersedia untuk role ini.</div> : null}
    </AppShell>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState("");

  async function validateUser() {
    const assignedCompanies = await fetchLoginCompanies(email);
    setCompanies(assignedCompanies);
    setCompanyId(assignedCompanies[0]?.id || "");
    setMessage(assignedCompanies.length ? "Pilih Nama PT sesuai assignment user." : "User belum aktif atau belum punya assignment PT.");
  }

  async function submit() {
    try {
      const loggedIn = await login(email, password, companyId);
      onLogin(loggedIn);
    } catch {
      setMessage("Login gagal. Cek username, password, dan pilihan PT.");
    }
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <h1>ERP [ Procure ]</h1>
        <label>Email / Username</label>
        <div className="inline-field">
          <input onBlur={() => email && validateUser()} onChange={(event) => setEmail(event.target.value)} value={email} />
          <button className="secondary-button" onClick={validateUser} type="button">
            Validasi
          </button>
        </div>
        {companies.length ? (
          <>
            <label>Nama PT</label>
            <select onChange={(event) => setCompanyId(event.target.value)} value={companyId}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <label>Password</label>
        <input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
        <p className="muted">{message || "Input username lalu validasi untuk menampilkan PT yang di-assign."}</p>
        <button className="primary-button full" disabled={!companyId || !password} onClick={submit} type="button">
          Login
        </button>
      </section>
    </div>
  );
}

function PurchaseRequestPage({
  approvals,
  purchaseRequests,
  onSaved,
  onCancel
}: {
  approvals: ApprovalRow[];
  purchaseRequests: PurchaseRequest[];
  onSaved: () => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [form, setForm] = useState({ title: "", department: "", priority: "Normal", description: "" });
  const [items, setItems] = useState<PurchaseItem[]>([{ ...blankItem }]);
  const [approvalRows, setApprovalRows] = useState<ApprovalDraft[]>([{ ...blankApproval }]);
  const [search, setSearch] = useState("");
  const filtered = purchaseRequests.filter((pr) => pr.documentNumber.toLowerCase().includes(search.toLowerCase()));

  function openForm(pr?: PurchaseRequest) {
    setEditing(pr || null);
    setForm({
      title: pr?.title || "",
      department: pr?.department || "",
      priority: pr?.priority || "Normal",
      description: pr?.description || ""
    });
    setItems(pr?.items?.length ? pr.items : [{ ...blankItem }]);
    const existingApprovals = pr
      ? approvals
          .filter((approval) => approval.documentType === "PR" && approval.documentId === pr.id)
          .map((approval) => ({
            approverName: approval.approverName,
            approverPosition: approval.approverPosition,
            approverEmail: approval.approverEmail
          }))
      : [];
    setApprovalRows(existingApprovals.length ? existingApprovals : [{ ...blankApproval }]);
    setShowForm(true);
  }

  async function submit() {
    await savePurchaseRequest({ ...form, items, approvals: approvalRows }, editing?.id);
    setShowForm(false);
    await onSaved();
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Daftar Purchase Request</h2>
            <p>List PR dengan status approval dan action workflow.</p>
          </div>
          <button className="primary-button" onClick={() => openForm()} type="button">
            + Buat PR Baru
          </button>
        </div>
        <input className="search" onChange={(event) => setSearch(event.target.value)} placeholder="Search nomor PR" value={search} />
        <DataTable columns="1fr 1fr 1fr 1fr 1fr 1fr 150px">
          <TableHead cells={["Nomor PR", "Tanggal", "Departemen", "Nilai", "Status", "Judul", "Aksi"]} />
          {filtered.map((pr) => (
            <div className="table-row" key={pr.id}>
              <strong>{pr.documentNumber}</strong>
              <span>{new Date().toLocaleDateString("id-ID")}</span>
              <span>{pr.department || "-"}</span>
              <strong>{money(pr.totalAmount)}</strong>
              <StatusBadge status={pr.status} />
              <span>{pr.title}</span>
              <div className="action-row">
                <button className="icon-button" onClick={() => openForm(pr)} title="View/Edit" type="button">
                  ✎
                </button>
                {pr.status !== "approved" && pr.status !== "cancelled" ? (
                  <button className="icon-button danger" onClick={() => onCancel(pr.id)} title="Cancel" type="button">
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </DataTable>
      </section>
      {showForm ? (
        <DocumentForm
          approvalRows={approvalRows}
          form={form}
          items={items}
          primaryLabel={editing ? "Update Purchase Request" : "Simpan Purchase Request"}
          setApprovalRows={setApprovalRows}
          setForm={setForm}
          setItems={setItems}
          submit={submit}
          title={editing ? `Edit PR ${editing.documentNumber}` : "Buat Purchase Request"}
        />
      ) : null}
    </div>
  );
}

function PurchaseOrderPage({
  purchaseRequests,
  purchaseOrders,
  vendors,
  onSaved,
  onCancel
}: {
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  onSaved: () => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const approvedPrs = purchaseRequests.filter((pr) => pr.status === "approved");
  const [selectedPrId, setSelectedPrId] = useState(approvedPrs[0]?.id || "");
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");
  const [taxPercent, setTaxPercent] = useState("11");
  const [approvalRows, setApprovalRows] = useState<ApprovalDraft[]>([{ ...blankApproval }]);
  const [quotation, setQuotation] = useState({ vendorName: "", attachmentName: "" });
  const selectedPr = purchaseRequests.find((pr) => pr.id === selectedPrId);

  async function submit() {
    await createPurchaseOrder({
      purchaseRequestId: selectedPrId,
      vendorId,
      taxPercent,
      approvals: approvalRows,
      quotations: [{ ...quotation, vendorName: quotation.vendorName || vendors.find((vendor) => vendor.id === vendorId)?.name, selected: true }]
    });
    await onSaved();
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>List Purchase Order</h2>
            <p>Data PO dari PR approved, termasuk PO rejected/cancelled.</p>
          </div>
        </div>
        <DataTable columns="1fr 1fr 1fr 1fr 1fr 130px">
          <TableHead cells={["Nomor PO", "Nomor PR", "Vendor", "Total", "Status", "Aksi"]} />
          {purchaseOrders.map((po) => (
            <div className="table-row" key={po.id}>
              <strong>{po.documentNumber}</strong>
              <span>{po.purchaseRequest?.documentNumber}</span>
              <span>{po.vendor?.name || "-"}</span>
              <strong>{money(po.totalAmount)}</strong>
              <StatusBadge status={po.status} />
              <div className="action-row">
                <button className="icon-button" title="View" type="button">
                  ◉
                </button>
                {po.status === "issued" ? (
                  <button className="icon-button danger" onClick={() => onCancel(po.id)} title="Cancel PO" type="button">
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </DataTable>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Buat Purchase Order</h2>
            <p>Pilih nomor PR approved, vendor, PPN, attachment penawaran, dan approval PO.</p>
          </div>
          <button className="primary-button" disabled={!selectedPrId} onClick={submit} type="button">
            + Buat PO
          </button>
        </div>
        <div className="form-grid three">
          <label>
            Purchase Request Number
            <select onChange={(event) => setSelectedPrId(event.target.value)} value={selectedPrId}>
              <option value="">Pilih PR approved</option>
              {approvedPrs.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.documentNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vendor
            <select onChange={(event) => setVendorId(event.target.value)} value={vendorId}>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            PPN %
            <input onChange={(event) => setTaxPercent(event.target.value)} type="number" value={taxPercent} />
          </label>
        </div>
        <div className="form-grid two">
          <label>
            Vendor Penawaran
            <input onChange={(event) => setQuotation({ ...quotation, vendorName: event.target.value })} value={quotation.vendorName} />
          </label>
          <label>
            Attachment PDF
            <input
              accept="application/pdf"
              onChange={(event) => setQuotation({ ...quotation, attachmentName: event.target.files?.[0]?.name || "" })}
              type="file"
            />
          </label>
        </div>
        <ReadonlyItems items={selectedPr?.items || []} taxPercent={Number(taxPercent || 0)} />
        <ApprovalEditor approvals={approvalRows} setApprovals={setApprovalRows} />
      </section>
    </div>
  );
}

function ApprovalPage({ approvals, onAction }: { approvals: ApprovalRow[]; onAction: () => Promise<void> }) {
  async function run(id: string, action: "approved" | "rejected" | "resend") {
    if (action === "resend") {
      await resendApproval(id);
    } else {
      await approvalAction(id, action);
    }
    await onAction();
  }

  return (
    <div className="page-stack">
      {(["PR", "PO"] as const).map((context) => (
        <section className="panel" key={context}>
          <div className="panel-header">
            <div>
              <h2>Approval {context === "PR" ? "Purchase Request" : "Purchase Order"}</h2>
              <p>Satu row untuk satu PIC approval, dengan aksi approve, reject, dan resend email.</p>
            </div>
          </div>
          <DataTable columns="0.7fr 1fr 1.2fr 1fr 1.4fr 1fr 150px">
            <TableHead cells={["Context", "Nomor", "Judul", "PIC", "Email", "Status PIC", "Aksi"]} />
            {approvals
              .filter((approval) => approval.documentType === context)
              .map((approval) => (
                <div className="table-row" key={approval.id}>
                  <span>{approval.documentType}</span>
                  <strong>{approval.documentNumber}</strong>
                  <span>{approval.documentTitle}</span>
                  <span>{approval.approverName}</span>
                  <span>{approval.approverEmail}</span>
                  <StatusBadge status={approval.status} />
                  <div className="action-row">
                    <button className="icon-button success-icon" onClick={() => run(approval.id, "approved")} title="Approve" type="button">
                      ✓
                    </button>
                    <button className="icon-button danger" onClick={() => run(approval.id, "rejected")} title="Reject" type="button">
                      ×
                    </button>
                    <button className="icon-button" onClick={() => run(approval.id, "resend")} title="Resend Email" type="button">
                      ✉
                    </button>
                  </div>
                </div>
              ))}
          </DataTable>
        </section>
      ))}
    </div>
  );
}

function ReceivePage({
  purchaseOrders,
  receives,
  onSaved
}: {
  purchaseOrders: PurchaseOrder[];
  receives: Receive[];
  onSaved: () => Promise<void>;
}) {
  const [selectedPoId, setSelectedPoId] = useState("");
  const [kind, setKind] = useState<"goods" | "service" | "mixed">("goods");
  const [basis, setBasis] = useState<"quantity" | "amount" | "deliverable">("quantity");
  const [handoverDocument, setHandoverDocument] = useState("");
  const selectedPo = purchaseOrders.find((po) => po.id === selectedPoId);
  const receiveLines = selectedPo?.items.map((item) => ({
    code: item.code,
    name: item.name,
    receivedQuantity: remainingQty(selectedPo, item),
    receivedAmount: String(Number(item.quantity) * Number(item.unitPrice))
  }));

  async function submit() {
    await createReceive({ purchaseOrderId: selectedPoId, kind, basis, handoverDocument, lines: receiveLines });
    await onSaved();
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>PO Siap Receive</h2>
            <p>Pilih PO issued, lalu proses penerimaan partial berdasarkan quantity, nominal, atau deliverables.</p>
          </div>
        </div>
        <DataTable columns="1fr 1fr 1fr 1fr 1fr 120px">
          <TableHead cells={["Nomor PO", "Vendor", "Nomor PR", "Total", "Status", "Aksi"]} />
          {purchaseOrders.map((po) => (
            <div className="table-row" key={po.id}>
              <strong>{po.documentNumber}</strong>
              <span>{po.vendor?.name || "-"}</span>
              <span>{po.purchaseRequest?.documentNumber}</span>
              <strong>{money(po.totalAmount)}</strong>
              <StatusBadge status={po.status} />
              <button className="primary-button small" onClick={() => setSelectedPoId(po.id)} type="button">
                Receive
              </button>
            </div>
          ))}
        </DataTable>
      </section>
      {selectedPo ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Receive {selectedPo.documentNumber}</h2>
              <p>Barang dan jasa dibedakan melalui tipe receive dan basis penerimaan.</p>
            </div>
            <button className="primary-button" onClick={submit} type="button">
              Simpan Receive
            </button>
          </div>
          <div className="form-grid three">
            <label>
              Tipe Receive
              <select onChange={(event) => setKind(event.target.value as "goods" | "service" | "mixed")} value={kind}>
                <option value="goods">Barang</option>
                <option value="service">Jasa</option>
                <option value="mixed">Barang + Jasa</option>
              </select>
            </label>
            <label>
              Basis Receive
              <select onChange={(event) => setBasis(event.target.value as "quantity" | "amount" | "deliverable")} value={basis}>
                <option value="quantity">Quantity</option>
                <option value="amount">Nominal</option>
                <option value="deliverable">Dokumen Deliverables</option>
              </select>
            </label>
            <label>
              Dokumen BAST/Serah Terima
              <input onChange={(event) => setHandoverDocument(event.target.files?.[0]?.name || "")} type="file" />
            </label>
          </div>
          <ReadonlyItems items={selectedPo.items} taxPercent={Number(selectedPo.taxPercent || 0)} />
        </section>
      ) : null}
      <SimpleListPage
        columns={[
          { header: "Nomor Receive", render: (row) => row.documentNumber },
          { header: "Nomor PO", render: (row) => row.purchaseOrder.documentNumber },
          { header: "Tipe", render: (row) => row.kind },
          { header: "Basis", render: (row) => row.basis },
          { header: "Dokumen", render: (row) => row.handoverDocument || "-" }
        ]}
        description="Histori penerimaan yang sudah diproses."
        getKey={(row) => row.id}
        rows={receives}
        title="Histori Receive"
      />
    </div>
  );
}

function DocumentForm({
  title,
  form,
  setForm,
  items,
  setItems,
  approvalRows,
  setApprovalRows,
  primaryLabel,
  submit
}: {
  title: string;
  form: { title: string; department: string; priority: string; description: string };
  setForm: (value: { title: string; department: string; priority: string; description: string }) => void;
  items: PurchaseItem[];
  setItems: (value: PurchaseItem[]) => void;
  approvalRows: ApprovalDraft[];
  setApprovalRows: (value: ApprovalDraft[]) => void;
  primaryLabel: string;
  submit: () => Promise<void>;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>Isi informasi PR, tambah beberapa item, lalu tambahkan PIC approval.</p>
        </div>
        <button className="primary-button" onClick={submit} type="button">
          {primaryLabel}
        </button>
      </div>
      <div className="form-grid two">
        <label>
          Judul PR
          <input onChange={(event) => setForm({ ...form, title: event.target.value })} value={form.title} />
        </label>
        <label>
          Departemen
          <input onChange={(event) => setForm({ ...form, department: event.target.value })} value={form.department} />
        </label>
        <label>
          Prioritas
          <select onChange={(event) => setForm({ ...form, priority: event.target.value })} value={form.priority}>
            <option>Normal</option>
            <option>Tinggi</option>
          </select>
        </label>
        <label>
          Deskripsi
          <input onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} />
        </label>
      </div>
      <EditableItems items={items} setItems={setItems} />
      <ApprovalEditor approvals={approvalRows} setApprovals={setApprovalRows} />
    </section>
  );
}

function EditableItems({ items, setItems }: { items: PurchaseItem[]; setItems: (items: PurchaseItem[]) => void }) {
  return (
    <div className="sub-panel">
      <div className="panel-header compact-header">
        <h3>Items</h3>
        <button className="secondary-button small" onClick={() => setItems([...items, { ...blankItem }])} type="button">
          + Tambah Item
        </button>
      </div>
      <DataTable columns="0.8fr 1.5fr 0.7fr 1fr 1fr 1fr 80px">
        <TableHead cells={["Kode", "Nama", "Qty", "Harga", "Kategori", "Gudang", "Aksi"]} />
        {items.map((item, index) => (
          <div className="table-row" key={index}>
            {(["code", "name", "quantity", "unitPrice", "category", "warehouse"] as const).map((field) => (
              <input
                key={field}
                onChange={(event) => setItems(items.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: event.target.value } : row)))}
                type={field === "quantity" || field === "unitPrice" ? "number" : "text"}
                value={item[field] || ""}
              />
            ))}
            <button className="icon-button danger" onClick={() => setItems(items.filter((_, rowIndex) => rowIndex !== index))} type="button">
              ×
            </button>
          </div>
        ))}
      </DataTable>
    </div>
  );
}

function ApprovalEditor({
  approvals,
  setApprovals
}: {
  approvals: ApprovalDraft[];
  setApprovals: (approvals: ApprovalDraft[]) => void;
}) {
  return (
    <div className="sub-panel">
      <div className="panel-header compact-header">
        <h3>Approval</h3>
        <button className="secondary-button small" onClick={() => setApprovals([...approvals, { ...blankApproval }])} type="button">
          + Tambah Approval
        </button>
      </div>
      <DataTable columns="1.2fr 1fr 1.3fr 80px">
        <TableHead cells={["Nama Approver", "Jabatan", "Email", "Aksi"]} />
        {approvals.map((approval, index) => (
          <div className="table-row" key={index}>
            {(["approverName", "approverPosition", "approverEmail"] as const).map((field) => (
              <input
                key={field}
                onChange={(event) =>
                  setApprovals(approvals.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: event.target.value } : row)))
                }
                value={approval[field]}
              />
            ))}
            <button className="icon-button danger" onClick={() => setApprovals(approvals.filter((_, rowIndex) => rowIndex !== index))} type="button">
              ×
            </button>
          </div>
        ))}
      </DataTable>
    </div>
  );
}

function ReadonlyItems({ items, taxPercent }: { items: PurchaseItem[]; taxPercent: number }) {
  return (
    <DataTable columns="0.8fr 1.6fr 0.7fr 1fr 0.8fr 1fr 1fr">
      <TableHead cells={["Kode", "Nama Barang / Jasa", "Qty", "Harga", "PPN %", "PPN", "Total"]} />
      {items.map((item) => {
        const net = Number(item.quantity) * Number(item.unitPrice);
        const vat = net * (taxPercent / 100);
        return (
          <div className="table-row" key={item.id || item.code}>
            <span>{item.code}</span>
            <span>{item.name}</span>
            <span>{Number(item.quantity).toLocaleString("id-ID")}</span>
            <span>{money(item.unitPrice)}</span>
            <span>{taxPercent}%</span>
            <span>{money(vat)}</span>
            <strong>{money(net + vat)}</strong>
          </div>
        );
      })}
    </DataTable>
  );
}

function DataTable({ children, columns }: { children: React.ReactNode; columns: string }) {
  return (
    <div className="table" style={{ ["--columns" as string]: columns }}>
      {children}
    </div>
  );
}

function TableHead({ cells }: { cells: string[] }) {
  return (
    <div className="table-head">
      {cells.map((cell) => (
        <span key={cell}>{cell}</span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status ${status}`}>{status.replaceAll("_", " ")}</span>;
}

function filterMenu(roles: Role[]): MenuItem[] {
  const modules = new Set(roles.flatMap((role) => role.modules));
  if (modules.has("master")) {
    return menuItems;
  }
  return menuItems.filter((item) => item.moduleKeys.some((key) => modules.has(key)));
}

function money(value: number | string) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function remainingQty(po: PurchaseOrder, item: PurchaseItem) {
  const received = (po.receivedLines || [])
    .filter((line) => line.code === item.code)
    .reduce((sum, line) => sum + Number(line.receivedQuantity), 0);
  return String(Math.max(Number(item.quantity) - received, 0));
}
