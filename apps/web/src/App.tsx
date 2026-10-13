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
  deleteCompany,
  deleteRole,
  deleteUser,
  deleteVendor,
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
  saveCompany,
  savePurchaseRequest,
  saveRole,
  saveUser,
  saveVendor,
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
  const isAdmin = Boolean(session?.user.roles.some((role) => role.id === "administrator"));

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
        <CompanyMasterPage
          companies={companies}
          isAdmin={isAdmin}
          onChanged={() => refreshWithNotice("Data company diperbarui.")}
        />
      ) : null}
      {activePage === "users" ? (
        <UserMasterPage
          companies={companies}
          isAdmin={isAdmin}
          onChanged={() => refreshWithNotice("Data user diperbarui.")}
          roles={roles}
          users={users}
        />
      ) : null}
      {activePage === "roles" ? (
        <RoleMasterPage isAdmin={isAdmin} onChanged={() => refreshWithNotice("Data role diperbarui.")} roles={roles} />
      ) : null}
      {activePage === "vendors" ? (
        <VendorMasterPage
          companies={companies}
          isAdmin={isAdmin}
          onChanged={() => refreshWithNotice("Data vendor diperbarui.")}
          vendors={vendors}
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
        <MasterModal
          onClose={() => setShowForm(false)}
          onSave={submit}
          title={editing ? `Edit PR ${editing.documentNumber}` : "Buat Purchase Request"}
        >
        <DocumentForm
          approvalRows={approvalRows}
          form={form}
          items={items}
          setApprovalRows={setApprovalRows}
          setForm={setForm}
          setItems={setItems}
          title={editing ? `Edit PR ${editing.documentNumber}` : "Buat Purchase Request"}
        />
        </MasterModal>
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
  const [showForm, setShowForm] = useState(false);
  const selectedPr = purchaseRequests.find((pr) => pr.id === selectedPrId);

  function openCreateForm() {
    setSelectedPrId(approvedPrs[0]?.id || "");
    setVendorId(vendors[0]?.id || "");
    setTaxPercent("11");
    setApprovalRows([{ ...blankApproval }]);
    setQuotation({ vendorName: "", attachmentName: "" });
    setShowForm(true);
  }

  async function submit() {
    await createPurchaseOrder({
      purchaseRequestId: selectedPrId,
      vendorId,
      taxPercent,
      approvals: approvalRows,
      quotations: [{ ...quotation, vendorName: quotation.vendorName || vendors.find((vendor) => vendor.id === vendorId)?.name, selected: true }]
    });
    setShowForm(false);
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
          <button className="primary-button" disabled={!approvedPrs.length} onClick={openCreateForm} type="button">
            + Buat PO
          </button>
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
      {showForm ? (
        <MasterModal onClose={() => setShowForm(false)} onSave={submit} title="Buat Purchase Order">
        <div className="master-form">
          <p className="muted">Pilih nomor PR approved, vendor, PPN, attachment penawaran, dan approval PO.</p>
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
        </div>
        </MasterModal>
      ) : null}
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

function CompanyMasterPage({
  companies,
  isAdmin,
  onChanged
}: {
  companies: Company[];
  isAdmin: boolean;
  onChanged: () => Promise<void>;
}) {
  const empty = { code: "", name: "", type: "Operasional", status: "active", isDefault: false, address: "" };
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  async function submit() {
    await saveCompany(form, editing?.id);
    setEditing(null);
    setForm(empty);
    setShowForm(false);
    await onChanged();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Master Company</h2>
          <p>CRUD data usaha untuk scope login dan transaksi.</p>
        </div>
        {isAdmin ? (
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setShowForm(true);
            }}
            type="button"
          >
            + Tambah Company
          </button>
        ) : null}
      </div>
      {showForm ? (
        <MasterModal
          onClose={() => setShowForm(false)}
          onSave={submit}
          title={editing ? "Edit Company" : "Tambah Company"}
        >
        <div className="master-form">
          <div className="form-grid three">
            <label>
              Kode Company
              <input onChange={(event) => setForm({ ...form, code: event.target.value })} value={form.code} />
            </label>
            <label>
              Nama Company
              <input onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
            </label>
            <label>
              Tipe
              <input onChange={(event) => setForm({ ...form, type: event.target.value })} value={form.type} />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Alamat Lengkap
              <input onChange={(event) => setForm({ ...form, address: event.target.value })} value={form.address} />
            </label>
            <label>
              Status
              <select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
          </div>
        </div>
        </MasterModal>
      ) : null}
      <DataTable columns="0.8fr 1.2fr 1fr 1.6fr 0.8fr 120px">
        <TableHead cells={["Kode", "Nama", "Tipe", "Alamat", "Status", "Aksi"]} />
        {companies.map((company) => (
          <div className="table-row" key={company.id}>
            <strong>{company.code}</strong>
            <span>{company.name}</span>
            <span>{company.type}</span>
            <span>{company.address || "-"}</span>
            <StatusBadge status={company.status} />
            <MasterActions
              disabled={!isAdmin}
              onDelete={() => deleteCompany(company.id).then(onChanged)}
              onEdit={() => {
                setEditing(company);
                setForm({
                  code: company.code,
                  name: company.name,
                  type: company.type,
                  status: company.status,
                  isDefault: company.isDefault,
                  address: company.address || ""
                });
                setShowForm(true);
              }}
            />
          </div>
        ))}
      </DataTable>
    </section>
  );
}

function UserMasterPage({
  users,
  companies,
  roles,
  isAdmin,
  onChanged
}: {
  users: User[];
  companies: Company[];
  roles: Role[];
  isAdmin: boolean;
  onChanged: () => Promise<void>;
}) {
  const empty = { name: "", email: "", password: "", status: "active", companyIds: [] as string[], roleIds: [] as string[] };
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  async function submit() {
    await saveUser(form, editing?.id);
    setEditing(null);
    setForm(empty);
    setShowForm(false);
    await onChanged();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>User Management</h2>
          <p>Maintain login, assignment Nama PT, dan roles user.</p>
        </div>
        {isAdmin ? (
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setShowForm(true);
            }}
            type="button"
          >
            + Tambah User
          </button>
        ) : null}
      </div>
      {showForm ? (
        <MasterModal
          onClose={() => setShowForm(false)}
          onSave={submit}
          title={editing ? "Edit User" : "Tambah User"}
        >
        <div className="master-form">
          <div className="form-grid three">
            <label>
              Nama User
              <input onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
            </label>
            <label>
              Email / Username
              <input onChange={(event) => setForm({ ...form, email: event.target.value })} value={form.email} />
            </label>
            <label>
              Password {editing ? "(kosongkan jika tidak diubah)" : ""}
              <input onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" value={form.password} />
            </label>
          </div>
          <div className="form-grid three">
            <label>
              Company Assignment
              <select multiple onChange={(event) => setForm({ ...form, companyIds: selectedValues(event.currentTarget) })} value={form.companyIds}>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Roles
              <select multiple onChange={(event) => setForm({ ...form, roleIds: selectedValues(event.currentTarget) })} value={form.roleIds}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
          </div>
        </div>
        </MasterModal>
      ) : null}
      <DataTable columns="1fr 1.4fr 1.6fr 1.2fr 0.8fr 120px">
        <TableHead cells={["Nama", "Email", "Company", "Role", "Status", "Aksi"]} />
        {users.map((user) => (
          <div className="table-row" key={user.id}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <span>{user.companies.map((company) => company.name).join(", ")}</span>
            <span>{user.roles.map((role) => role.name).join(", ")}</span>
            <StatusBadge status={user.status} />
            <MasterActions
              disabled={!isAdmin}
              onDelete={() => deleteUser(user.id).then(onChanged)}
              onEdit={() => {
                setEditing(user);
                setForm({
                  name: user.name,
                  email: user.email,
                  password: "",
                  status: user.status,
                  companyIds: user.companies.map((company) => company.id),
                  roleIds: user.roles.map((role) => role.id)
                });
                setShowForm(true);
              }}
            />
          </div>
        ))}
      </DataTable>
    </section>
  );
}

function RoleMasterPage({ roles, isAdmin, onChanged }: { roles: Role[]; isAdmin: boolean; onChanged: () => Promise<void> }) {
  const availableModules = menuItems.flatMap((item) => item.moduleKeys).filter((value, index, array) => array.indexOf(value) === index);
  const empty = { id: "", name: "", modules: [] as string[], status: "active" };
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  async function submit() {
    await saveRole(form, editing?.id);
    setEditing(null);
    setForm(empty);
    setShowForm(false);
    await onChanged();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Roles Management</h2>
          <p>Atur roles dapat menu apa saja. Hanya Administrator yang bisa CRUD.</p>
        </div>
        {isAdmin ? (
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setShowForm(true);
            }}
            type="button"
          >
            + Tambah Role
          </button>
        ) : null}
      </div>
      {showForm ? (
        <MasterModal
          onClose={() => setShowForm(false)}
          onSave={submit}
          title={editing ? "Edit Role" : "Tambah Role"}
        >
        <div className="master-form">
          <div className="form-grid three">
            <label>
              Kode Role
              <input disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, id: event.target.value })} value={form.id} />
            </label>
            <label>
              Nama Role
              <input onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
            </label>
            <label>
              Status
              <select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
          </div>
          <div className="module-grid">
            {availableModules.map((module) => (
              <label className="check-row" key={module}>
                <input
                  checked={form.modules.includes(module)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      modules: event.target.checked ? [...form.modules, module] : form.modules.filter((item) => item !== module)
                    })
                  }
                  type="checkbox"
                />
                {module}
              </label>
            ))}
          </div>
        </div>
        </MasterModal>
      ) : null}
      <DataTable columns="1fr 1.2fr 2fr 0.8fr 120px">
        <TableHead cells={["Kode", "Role", "Menu", "Status", "Aksi"]} />
        {roles.map((role) => (
          <div className="table-row" key={role.id}>
            <strong>{role.id}</strong>
            <span>{role.name}</span>
            <span>{role.modules.join(", ")}</span>
            <StatusBadge status={role.status} />
            <MasterActions
              disabled={!isAdmin}
              onDelete={() => deleteRole(role.id).then(onChanged)}
              onEdit={() => {
                setEditing(role);
                setForm({ id: role.id, name: role.name, modules: role.modules, status: role.status });
                setShowForm(true);
              }}
            />
          </div>
        ))}
      </DataTable>
    </section>
  );
}

function VendorMasterPage({
  vendors,
  companies,
  isAdmin,
  onChanged
}: {
  vendors: Vendor[];
  companies: Company[];
  isAdmin: boolean;
  onChanged: () => Promise<void>;
}) {
  const empty = {
    companyId: companies[0]?.id || "",
    code: "",
    name: "",
    contactPerson: "",
    email: "",
    type: "Barang / Jasa",
    status: "active",
    address: "",
    note: ""
  };
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!form.companyId && companies[0]?.id) {
      setForm((current) => ({ ...current, companyId: companies[0].id }));
    }
  }, [companies, form.companyId]);

  async function submit() {
    await saveVendor(form, editing?.id);
    setEditing(null);
    setForm({ ...empty, companyId: companies[0]?.id || "" });
    setShowForm(false);
    await onChanged();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Master Vendor</h2>
          <p>CRUD vendor per company, termasuk alamat detail dan kontak.</p>
        </div>
        {isAdmin ? (
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setForm({ ...empty, companyId: companies[0]?.id || "" });
              setShowForm(true);
            }}
            type="button"
          >
            + Tambah Vendor
          </button>
        ) : null}
      </div>
      {showForm ? (
        <MasterModal
          onClose={() => setShowForm(false)}
          onSave={submit}
          title={editing ? "Edit Vendor" : "Tambah Vendor"}
        >
        <div className="master-form">
          <div className="form-grid three">
            <label>
              Company
              <select onChange={(event) => setForm({ ...form, companyId: event.target.value })} value={form.companyId}>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kode Vendor
              <input onChange={(event) => setForm({ ...form, code: event.target.value })} value={form.code} />
            </label>
            <label>
              Nama Vendor
              <input onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
            </label>
          </div>
          <div className="form-grid three">
            <label>
              Kontak
              <input onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} value={form.contactPerson} />
            </label>
            <label>
              Email
              <input onChange={(event) => setForm({ ...form, email: event.target.value })} value={form.email} />
            </label>
            <label>
              Tipe
              <input onChange={(event) => setForm({ ...form, type: event.target.value })} value={form.type} />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Alamat Detail
              <input onChange={(event) => setForm({ ...form, address: event.target.value })} value={form.address} />
            </label>
            <label>
              Status
              <select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
          </div>
        </div>
        </MasterModal>
      ) : null}
      <DataTable columns="0.8fr 1.3fr 1fr 1fr 1.5fr 0.8fr 120px">
        <TableHead cells={["Kode", "Nama", "Company", "Tipe", "Alamat", "Status", "Aksi"]} />
        {vendors.map((vendor) => (
          <div className="table-row" key={vendor.id}>
            <strong>{vendor.code}</strong>
            <span>{vendor.name}</span>
            <span>{vendor.company?.name}</span>
            <span>{vendor.type}</span>
            <span>{vendor.address || "-"}</span>
            <StatusBadge status={vendor.status} />
            <MasterActions
              disabled={!isAdmin}
              onDelete={() => deleteVendor(vendor.id).then(onChanged)}
              onEdit={() => {
                setEditing(vendor);
                setForm({
                  companyId: vendor.company?.id || companies[0]?.id || "",
                  code: vendor.code,
                  name: vendor.name,
                  contactPerson: "",
                  email: "",
                  type: vendor.type,
                  status: vendor.status,
                  address: vendor.address || "",
                  note: ""
                });
                setShowForm(true);
              }}
            />
          </div>
        ))}
      </DataTable>
    </section>
  );
}

function DocumentForm({
  title,
  form,
  setForm,
  items,
  setItems,
  approvalRows,
  setApprovalRows
}: {
  title: string;
  form: { title: string; department: string; priority: string; description: string };
  setForm: (value: { title: string; department: string; priority: string; description: string }) => void;
  items: PurchaseItem[];
  setItems: (value: PurchaseItem[]) => void;
  approvalRows: ApprovalDraft[];
  setApprovalRows: (value: ApprovalDraft[]) => void;
}) {
  return (
    <div className="master-form">
      <p className="muted">{title}: isi informasi PR, tambah beberapa item, lalu tambahkan PIC approval.</p>
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
    </div>
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

function MasterModal({
  title,
  children,
  onClose,
  onSave
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="panel-header">
          <div>
            <h2>{title}</h2>
            <p>Lengkapi field, lalu klik Save untuk menyimpan.</p>
          </div>
          <button className="icon-button danger" onClick={onClose} title="Tutup" type="button">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary-button" onClick={() => void onSave()} type="button">
            Simpan
          </button>
        </div>
      </section>
    </div>
  );
}

function MasterActions({
  disabled,
  onEdit,
  onDelete
}: {
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  if (disabled) {
    return <span className="muted">Read only</span>;
  }

  return (
    <div className="action-row">
      <button className="icon-button" onClick={onEdit} title="Edit" type="button">
        ✎
      </button>
      <button className="icon-button danger" onClick={() => void onDelete()} title="Nonaktifkan" type="button">
        ×
      </button>
    </div>
  );
}

function filterMenu(roles: Role[]): MenuItem[] {
  const modules = new Set(roles.flatMap((role) => role.modules));
  if (modules.has("master")) {
    return menuItems;
  }
  return menuItems.filter((item) => item.moduleKeys.some((key) => modules.has(key)));
}

function selectedValues(select: HTMLSelectElement) {
  return Array.from(select.selectedOptions).map((option) => option.value);
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
