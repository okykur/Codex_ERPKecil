import { useEffect, useMemo, useState } from "react";
import { AppShell, MenuItem, menuItems, moduleLabel } from "./components/AppShell";
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
  savePurchaseOrder,
  createReceive,
  deleteCompany,
  deleteRole,
  deleteUser,
  deleteVendor,
  fetchApprovals,
  fetchCompanies,
  fetchEligiblePurchaseRequests,
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

type PurchaseRequestForm = {
  title: string;
  department: string;
  priority: string;
  shortDescription: string;
  description: string;
};

type PurchaseOrderItemDraft = PurchaseItem & {
  maxQuantity: number;
};

const blankItem: PurchaseItem = { code: "", name: "", quantity: "1", unitPrice: "", category: "Asset", warehouse: "User Request" };
const blankApproval: ApprovalDraft = { approverName: "", approverPosition: "", approverEmail: "" };
const freeEmailDomains = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.id", "ymail.com", "rocketmail.com", "hotmail.com",
  "hotmail.co.id", "outlook.com", "outlook.co.id", "live.com", "live.co.id", "msn.com", "aol.com", "icloud.com",
  "me.com", "mail.com", "protonmail.com", "proton.me", "gmx.com", "yandex.com", "mail.ru", "tutanota.com"
]);

function isBusinessEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] || "";
  const usesFreeEmail = [...freeEmailDomains].some((freeDomain) => domain === freeDomain || domain.endsWith(`.${freeDomain}`));
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && !usesFreeEmail;
}

export function App() {
  const [session, setSession] = useState<Session | null>(() => storedSession());
  const [activePage, setActivePage] = useState("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [eligiblePurchaseRequests, setEligiblePurchaseRequests] = useState<PurchaseRequest[]>([]);
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
    const canAccessPurchaseOrders = session.user.roles.some(
      (role) => role.id === "administrator" || role.modules.includes("purchase-order")
    );
    const [companyData, userData, roleData, vendorData, prData, eligiblePrData, poData, approvalData, receivePoData, receiveData] =
      await Promise.all([
        fetchCompanies(),
        fetchUsers(),
        fetchRoles(),
        fetchVendors(companyId),
        fetchPurchaseRequests(companyId),
        canAccessPurchaseOrders ? fetchEligiblePurchaseRequests() : Promise.resolve([]),
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
    setEligiblePurchaseRequests(eligiblePrData);
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
          activeCompany={session.activeCompany}
          allowedPageIds={allowedMenu.map((item) => item.id)}
          assignedCompanies={session.companies}
          companies={companies}
          isAdmin={isAdmin}
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
          onResent={() => refreshWithNotice("Email approval Purchase Request dikirim ulang.")}
          onSaved={() => refreshWithNotice("Purchase Request tersimpan.")}
          purchaseRequests={purchaseRequests}
        />
      ) : null}
      {activePage === "purchase-order" ? (
        <PurchaseOrderPage
          approvals={approvals}
          onCancel={(id) => cancelPurchaseOrder(id).then(() => refreshWithNotice("Purchase Order dicancel."))}
          onSaved={() => refreshWithNotice("Purchase Order tersimpan.")}
          purchaseOrders={purchaseOrders}
          purchaseRequests={eligiblePurchaseRequests}
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
  onCancel,
  onResent
}: {
  approvals: ApprovalRow[];
  purchaseRequests: PurchaseRequest[];
  onSaved: () => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onResent: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseRequest | null>(null);
  const [resendTarget, setResendTarget] = useState<PurchaseRequest | null>(null);
  const [form, setForm] = useState<PurchaseRequestForm>({
    title: "",
    department: "",
    priority: "Normal",
    shortDescription: "",
    description: ""
  });
  const [items, setItems] = useState<PurchaseItem[]>([{ ...blankItem }]);
  const [approvalRows, setApprovalRows] = useState<ApprovalDraft[]>([{ ...blankApproval }]);
  const [formError, setFormError] = useState("");
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = purchaseRequests.filter((pr) => pr.documentNumber.toLowerCase().includes(search.toLowerCase()));

  function openForm(pr?: PurchaseRequest) {
    setEditing(pr || null);
    const nextForm = {
      title: pr?.title || "",
      department: pr?.department || "",
      priority: pr?.priority || "Normal",
      shortDescription: pr?.shortDescription || "",
      description: pr?.description || ""
    };
    const nextItems = pr?.items?.length ? pr.items : [{ ...blankItem }];
    const existingApprovals = pr
      ? approvals
          .filter((approval) => approval.documentType === "PR" && approval.documentId === pr.id)
          .map((approval) => ({
            approverName: approval.approverName,
            approverPosition: approval.approverPosition,
            approverEmail: approval.approverEmail
          }))
      : [];
    const nextApprovals = existingApprovals.length ? existingApprovals : [{ ...blankApproval }];
    setForm(nextForm);
    setItems(nextItems);
    setApprovalRows(nextApprovals);
    setFormError("");
    setShowForm(true);
  }

  async function submit() {
    if (!form.title.trim() || !form.department.trim() || !form.shortDescription.trim()) {
      setFormError("Judul PR, Departemen, dan Short Description wajib diisi.");
      return;
    }
    if (!items.length || items.some((item) => !item.name.trim() || Number(item.quantity) <= 0)) {
      setFormError("Minimal satu item wajib diisi dengan Nama dan Qty lebih dari 0.");
      return;
    }
    const filledApprovals = approvalRows.filter(
      (approval) => approval.approverName.trim() || approval.approverEmail.trim() || approval.approverPosition.trim()
    );
    if (filledApprovals.some((approval) => !approval.approverName.trim() || !approval.approverEmail.trim())) {
      setFormError("Nama dan email wajib diisi untuk setiap approval.");
      return;
    }
    if (filledApprovals.some((approval) => !isBusinessEmail(approval.approverEmail))) {
      setFormError("Email approval wajib menggunakan email perusahaan, bukan Gmail, Yahoo, Hotmail, Live, atau email gratis lainnya.");
      return;
    }
    await savePurchaseRequest({ ...form, items, approvals: approvalRows }, editing?.id);
    setShowForm(false);
    setShowDiscardConfirmation(false);
    await onSaved();
  }

  function requestCloseForm() {
    const hasContent = Boolean(
      form.title.trim() ||
      form.department.trim() ||
      form.shortDescription.trim() ||
      form.description.trim() ||
      items.some((item) => item.name.trim() || item.unitPrice !== "" || item.quantity !== "1") ||
      approvalRows.some((approval) => approval.approverName.trim() || approval.approverEmail.trim())
    );
    if (hasContent) {
      setShowDiscardConfirmation(true);
      return;
    }
    setShowForm(false);
  }

  async function confirmCancel() {
    if (!cancelTarget) {
      return;
    }
    await onCancel(cancelTarget.id);
    setCancelTarget(null);
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
        <DataTable columns="1fr 1fr 1fr 1fr 1fr 1fr 165px">
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
                {pr.status === "waiting_approval" && approvals.some(
                  (approval) => approval.documentType === "PR" && approval.documentId === pr.id && approval.status === "waiting_response"
                ) ? (
                  <button className="icon-button" onClick={() => setResendTarget(pr)} title="Kirim ulang email approval" type="button">
                    ✉
                  </button>
                ) : null}
                <button
                  className="icon-button"
                  disabled={pr.status === "cancelled" || pr.hasPurchaseOrder}
                  onClick={() => openForm(pr)}
                  title={pr.hasPurchaseOrder ? "Tidak dapat diedit karena PO sudah dibuat" : "Edit PR"}
                  type="button"
                >
                  ✎
                </button>
                {pr.status !== "approved" && pr.status !== "cancelled" ? (
                  <button className="icon-button danger" onClick={() => setCancelTarget(pr)} title="Cancel" type="button">
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
          onClose={requestCloseForm}
          onSave={submit}
          title={editing ? `Edit PR ${editing.documentNumber}` : "Buat Purchase Request"}
        >
        {formError ? <div className="alert">{formError}</div> : null}
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
      {showDiscardConfirmation ? (
        <ConfirmModal
          confirmLabel="Ya, Tutup Form"
          message="Data yang sudah diisi atau diubah belum disimpan dan akan hilang. Tetap tutup form Purchase Request?"
          onClose={() => setShowDiscardConfirmation(false)}
          onConfirm={async () => {
            setShowDiscardConfirmation(false);
            setShowForm(false);
          }}
          title="Konfirmasi Tutup Form"
        />
      ) : null}
      {cancelTarget ? (
        <ConfirmModal
          confirmLabel="Ya, Cancel PR"
          message={`Purchase Request ${cancelTarget.documentNumber} akan diubah menjadi cancelled. Tindakan ini tidak dapat dibatalkan.`}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
          title="Konfirmasi Cancel Purchase Request"
        />
      ) : null}
      {resendTarget ? (
        <ResendApprovalModal
          approvals={approvals.filter((approval) => approval.documentType === "PR" && approval.documentId === resendTarget.id)}
          documentNumber={resendTarget.documentNumber}
          onClose={() => setResendTarget(null)}
          onResent={onResent}
        />
      ) : null}
    </div>
  );
}

function PurchaseOrderPage({
  approvals,
  purchaseRequests,
  purchaseOrders,
  vendors,
  onSaved,
  onCancel
}: {
  approvals: ApprovalRow[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  onSaved: () => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrder | null>(null);
  const [selectedPrIds, setSelectedPrIds] = useState<string[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [taxPercent, setTaxPercent] = useState("11");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PurchaseOrderItemDraft[]>([]);
  const [removedItemKeys, setRemovedItemKeys] = useState<Set<string>>(new Set());
  const [approvalRows, setApprovalRows] = useState<ApprovalDraft[]>([{ ...blankApproval }]);
  const [quotation, setQuotation] = useState({ vendorName: "", attachmentName: "" });
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteItemIndex, setDeleteItemIndex] = useState<number | null>(null);

  const selectableRequests = uniquePurchaseRequests([
    ...purchaseRequests,
    ...(editing ? purchaseOrderRequests(editing) : [])
  ]).filter((pr) => pr.status === "approved");

  function openForm(po?: PurchaseOrder) {
    const selectedRequests = po ? purchaseOrderRequests(po) : [];
    const existingApprovals = po
      ? approvals
          .filter((approval) => approval.documentType === "PO" && approval.documentId === po.id)
          .map((approval) => ({
            approverName: approval.approverName,
            approverPosition: "",
            approverEmail: approval.approverEmail
          }))
      : [];
    const selectedQuotation = po?.quotations?.find((row) => row.selected) || po?.quotations?.[0];
    setEditing(po || null);
    setSelectedPrIds(selectedRequests.map((pr) => pr.id));
    setVendorId(po?.vendor?.id || vendors[0]?.id || "");
    setTaxPercent(po?.taxPercent || "11");
    setShortDescription(po?.shortDescription || "");
    setDescription(po?.description || "");
    setItems(aggregatePurchaseOrderItems(selectedRequests, po?.items || [], new Set(), Boolean(po)));
    setRemovedItemKeys(new Set());
    setApprovalRows(existingApprovals.length ? existingApprovals : [{ ...blankApproval }]);
    setQuotation({
      vendorName: selectedQuotation?.vendorName || po?.vendor?.name || "",
      attachmentName: selectedQuotation?.attachmentName || ""
    });
    setFormError("");
    setShowForm(true);
  }

  function togglePurchaseRequest(prId: string) {
    const nextIds = selectedPrIds.includes(prId)
      ? selectedPrIds.filter((id) => id !== prId)
      : [...selectedPrIds, prId];
    const selectedRequests = selectableRequests.filter((pr) => nextIds.includes(pr.id));
    setSelectedPrIds(nextIds);
    setItems(aggregatePurchaseOrderItems(selectedRequests, items, removedItemKeys));
  }

  async function submit() {
    if (!selectedPrIds.length || !vendorId || taxPercent.trim() === "" || !shortDescription.trim()) {
      setFormError("Purchase Request Number, Vendor, PPN %, dan Short Description wajib diisi.");
      return;
    }
    const tax = Number(taxPercent);
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      setFormError("PPN wajib berupa angka 0 sampai 100.");
      return;
    }
    if (!items.length || items.some((item) => Number(item.quantity) <= 0 || Number(item.quantity) > item.maxQuantity || Number(item.unitPrice) < 0)) {
      setFormError("Minimal satu item wajib dipilih. Qty harus lebih dari 0 dan tidak melebihi total qty PR.");
      return;
    }
    const filledApprovals = approvalRows.filter((approval) => approval.approverName.trim() || approval.approverEmail.trim());
    if (filledApprovals.some((approval) => !approval.approverName.trim() || !approval.approverEmail.trim())) {
      setFormError("Nama dan email wajib diisi untuk setiap approval.");
      return;
    }
    if (filledApprovals.some((approval) => !isBusinessEmail(approval.approverEmail))) {
      setFormError("Email approval wajib menggunakan email perusahaan, bukan Gmail, Yahoo, Hotmail, Live, atau email gratis lainnya.");
      return;
    }
    await savePurchaseOrder({
      purchaseRequestIds: selectedPrIds,
      vendorId,
      taxPercent,
      shortDescription,
      description,
      items: items.map(({ maxQuantity: _maxQuantity, ...item }) => item),
      approvals: approvalRows,
      quotations: [{ ...quotation, vendorName: quotation.vendorName || vendors.find((vendor) => vendor.id === vendorId)?.name, selected: true }]
    }, editing?.id);
    setShowForm(false);
    await onSaved();
  }

  async function confirmCancel() {
    if (!cancelTarget) {
      return;
    }
    await onCancel(cancelTarget.id);
    setCancelTarget(null);
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>List Purchase Order</h2>
            <p>Data PO dari PR approved, termasuk PO rejected/cancelled.</p>
          </div>
          <button className="primary-button" onClick={() => openForm()} type="button">
            + Buat PO
          </button>
        </div>
        <DataTable columns="1fr 1.3fr 1fr 1fr 1fr 170px">
          <TableHead cells={["Nomor PO", "Nomor PR", "Vendor", "Total", "Status", "Aksi"]} />
          {purchaseOrders.map((po) => (
            <div className="table-row" key={po.id}>
              <strong>{po.documentNumber}</strong>
              <span>{purchaseOrderRequestNumbers(po)}</span>
              <span>{po.vendor?.name || "-"}</span>
              <strong>{money(po.totalAmount)}</strong>
              <StatusBadge status={po.status} />
              <div className="action-row">
                <button className="icon-button" onClick={() => setViewing(po)} title="Lihat detail PO" type="button">
                  ◉
                </button>
                {["waiting_approval", "rejected"].includes(po.status) ? (
                  <button className="icon-button" onClick={() => openForm(po)} title="Edit PO" type="button">
                    ✎
                  </button>
                ) : null}
                {["draft", "waiting_approval"].includes(po.status) ? (
                  <button className="icon-button danger" onClick={() => setCancelTarget(po)} title="Cancel PO" type="button">
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </DataTable>
      </section>
      {showForm ? (
        <MasterModal onClose={() => setShowForm(false)} onSave={submit} title={editing ? `Edit PO ${editing.documentNumber}` : "Buat Purchase Order"}>
        <div className="master-form">
          {formError ? <div className="alert">{formError}</div> : null}
          <p className="muted">Pilih satu atau beberapa PR approved yang belum digunakan pada PO aktif.</p>
          {!selectableRequests.length ? (
            <div className="alert">Belum ada Purchase Request approved yang belum dibuatkan Purchase Order.</div>
          ) : null}
          <div className="sub-panel">
            <div className="compact-header">
              <h3>Purchase Request Number *</h3>
            </div>
            <div className="module-grid">
              {selectableRequests.map((pr) => (
                <label className="check-row" key={pr.id}>
                  <input checked={selectedPrIds.includes(pr.id)} onChange={() => togglePurchaseRequest(pr.id)} type="checkbox" />
                  <span>{pr.documentNumber}</span>
                </label>
              ))}
            </div>
          </div>
        <div className="form-grid three">
          <label>
            Vendor *
            <select onChange={(event) => setVendorId(event.target.value)} value={vendorId}>
              <option value="">Pilih Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            PPN % *
            <input max="100" min="0" onChange={(event) => setTaxPercent(event.target.value)} type="number" value={taxPercent} />
          </label>
          <label>
            Short Description *
            <input maxLength={255} onChange={(event) => setShortDescription(event.target.value)} value={shortDescription} />
          </label>
          <label className="full-field">
            Description
            <textarea onChange={(event) => setDescription(event.target.value)} rows={3} value={description} />
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
        <DataTable columns="1.6fr 0.7fr 0.8fr 1fr 1fr 70px">
          <TableHead cells={["Nama Barang / Jasa", "Maks Qty PR", "Qty PO", "Harga", "Total", "Aksi"]} />
          {items.map((item, index) => (
            <div className="table-row" key={`${item.name}-${index}`}>
              <strong>{item.name}</strong>
              <span>{item.maxQuantity.toLocaleString("id-ID")}</span>
              <input
                max={item.maxQuantity}
                min="0.01"
                onChange={(event) => {
                  const entered = Number(event.target.value);
                  const quantity = entered > item.maxQuantity ? String(item.maxQuantity) : event.target.value;
                  setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, quantity } : row));
                }}
                type="number"
                value={item.quantity}
              />
              <input
                min="0"
                onChange={(event) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, unitPrice: event.target.value } : row))}
                type="number"
                value={item.unitPrice}
              />
              <strong>{money(Number(item.quantity) * Number(item.unitPrice))}</strong>
              <button className="icon-button danger" onClick={() => setDeleteItemIndex(index)} title="Hapus item PO" type="button">×</button>
            </div>
          ))}
        </DataTable>
        <ApprovalEditor approvals={approvalRows} hidePosition setApprovals={setApprovalRows} />
        </div>
        </MasterModal>
      ) : null}
      {deleteItemIndex !== null ? (
        <ConfirmModal
          confirmLabel="Ya, Hapus Item"
          message={`Item ${items[deleteItemIndex]?.name || "terpilih"} akan dihapus dari Purchase Order.`}
          onClose={() => setDeleteItemIndex(null)}
          onConfirm={async () => {
            setRemovedItemKeys(new Set([...removedItemKeys, itemNameKey(items[deleteItemIndex]?.name || "")]));
            setItems(items.filter((_, index) => index !== deleteItemIndex));
            setDeleteItemIndex(null);
          }}
          title="Konfirmasi Hapus Item PO"
        />
      ) : null}
      {cancelTarget ? (
        <ConfirmModal
          confirmLabel="Ya, Cancel PO"
          message={`Purchase Order ${cancelTarget.documentNumber} akan diubah menjadi cancelled. Tindakan ini tidak dapat dibatalkan.`}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
          title="Konfirmasi Cancel Purchase Order"
        />
      ) : null}
      {viewing ? <PurchaseOrderDetailModal onClose={() => setViewing(null)} purchaseOrder={viewing} /> : null}
    </div>
  );
}

function ApprovalPage({ approvals, onAction }: { approvals: ApprovalRow[]; onAction: () => Promise<void> }) {
  const [detailApproval, setDetailApproval] = useState<ApprovalRow | null>(null);

  async function run(id: string, action: "approved" | "rejected") {
    await approvalAction(id, action);
    await onAction();
  }

  return (
    <div className="page-stack">
      {(["PR", "PO"] as const).map((context) => (
        <section className="panel" key={context}>
          <div className="panel-header">
            <div>
              <h2>Approval {context === "PR" ? "Purchase Request" : "Purchase Order"}</h2>
              <p>Satu row untuk satu PIC approval, dengan detail dokumen dan aksi keputusan sesuai status.</p>
            </div>
          </div>
          <DataTable columns="0.7fr 1fr 1.2fr 1fr 1.4fr 1fr 150px">
            <TableHead cells={["Context", "Nomor", "Judul", "PIC", "Email", "Status PIC", "Aksi"]} />
            {approvals
              .filter((approval) => approval.documentType === context)
              .map((approval) => {
                const decisionIsFinal = ["approved", "rejected"].includes(approval.status);
                const documentIsFinal = ["approved", "issued", "rejected", "cancelled"].includes(approval.documentStatus);
                return (
                  <div className="table-row" key={approval.id}>
                    <span>{approval.documentType}</span>
                    <strong>{approval.documentNumber}</strong>
                    <span>{approval.documentTitle}</span>
                    <span>{approval.approverName}</span>
                    <span>{approval.approverEmail}</span>
                    <StatusBadge status={approval.status} />
                    <div className="action-row">
                      <button className="icon-button" onClick={() => setDetailApproval(approval)} title={`Lihat detail ${approval.documentType}`} type="button">
                        ◉
                      </button>
                      {!decisionIsFinal && !documentIsFinal ? (
                        <>
                          <button className="icon-button success-icon" onClick={() => run(approval.id, "approved")} title="Approve" type="button">
                            ✓
                          </button>
                          <button className="icon-button danger" onClick={() => run(approval.id, "rejected")} title="Reject" type="button">
                            ×
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
          </DataTable>
        </section>
      ))}
      {detailApproval ? <DocumentDetailModal approval={detailApproval} onClose={() => setDetailApproval(null)} /> : null}
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
  const [basis, setBasis] = useState<"quantity" | "amount" | "deliverable">("quantity");
  const [handoverDocument, setHandoverDocument] = useState("");
  const [receiveLines, setReceiveLines] = useState<Array<{
    code: string;
    name: string;
    receivedQuantity: string;
    receivedAmount: string;
  }>>([]);
  const [formError, setFormError] = useState("");
  const selectedPo = purchaseOrders.find((po) => po.id === selectedPoId);

  function openReceive(po: PurchaseOrder) {
    setSelectedPoId(po.id);
    setBasis("quantity");
    setHandoverDocument("");
    setFormError("");
    setReceiveLines(po.items.map((item) => ({
      code: item.code,
      name: item.name,
      receivedQuantity: remainingQty(po, item),
      receivedAmount: String(Number(remainingQty(po, item)) * Number(item.unitPrice))
    })));
  }

  function closeReceive() {
    setSelectedPoId("");
    setReceiveLines([]);
    setFormError("");
    setHandoverDocument("");
  }

  async function submit() {
    if (!selectedPo) {
      return;
    }
    const lines = receiveLines
      .filter((line) => Number(line.receivedQuantity) > 0)
      .map((line) => {
        const poItem = selectedPo.items.find((item) => item.code === line.code);
        return {
          ...line,
          receivedAmount: String(Number(line.receivedQuantity) * Number(poItem?.unitPrice || 0))
        };
      });
    if (!lines.length) {
      setFormError("Minimal satu item harus memiliki Qty Receive lebih dari 0.");
      return;
    }
    await createReceive({ purchaseOrderId: selectedPoId, basis, handoverDocument, lines });
    closeReceive();
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
              <span>{purchaseOrderRequestNumbers(po)}</span>
              <strong>{money(po.totalAmount)}</strong>
              <StatusBadge status={po.status} />
              <button className="primary-button small" onClick={() => openReceive(po)} type="button">
                Receive
              </button>
            </div>
          ))}
        </DataTable>
      </section>
      {selectedPo ? (
        <MasterModal onClose={closeReceive} onSave={submit} title={`Receive ${selectedPo.documentNumber}`}>
          <div className="master-form">
            <p className="muted">Isi Qty Receive sesuai penerimaan saat ini. Sisa dapat diterima pada transaksi berikutnya.</p>
            {formError ? <div className="alert">{formError}</div> : null}
            <div className="form-grid two">
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
            <DataTable columns="0.8fr 1.6fr 0.7fr 0.8fr 0.8fr 1fr">
              <TableHead cells={["Kode", "Nama Barang / Jasa", "Qty PO", "Sudah Receive", "Sisa", "Qty Receive"]} />
              {selectedPo.items.map((item) => {
                const remaining = Number(remainingQty(selectedPo, item));
                const received = Number(item.quantity) - remaining;
                const line = receiveLines.find((row) => row.code === item.code);
                return (
                  <div className="table-row" key={item.id || item.code}>
                    <span>{item.code}</span>
                    <strong>{item.name}</strong>
                    <span>{Number(item.quantity).toLocaleString("id-ID")}</span>
                    <span>{received.toLocaleString("id-ID")}</span>
                    <span>{remaining.toLocaleString("id-ID")}</span>
                    <input
                      inputMode="decimal"
                      max={remaining}
                      min="0"
                      onChange={(event) => {
                        const entered = Number(event.target.value);
                        const quantity = entered > remaining ? String(remaining) : event.target.value;
                        setReceiveLines(receiveLines.map((row) => row.code === item.code ? { ...row, receivedQuantity: quantity } : row));
                      }}
                      step="0.01"
                      type="number"
                      value={line?.receivedQuantity || ""}
                    />
                  </div>
                );
              })}
            </DataTable>
          </div>
        </MasterModal>
      ) : null}
      <SimpleListPage
        columns={[
          { header: "Nomor Receive", render: (row) => row.documentNumber },
          { header: "Nomor PO", render: (row) => row.purchaseOrder.documentNumber },
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
            {editing ? (
              <label>
                Kode Role
                <input disabled value={form.id} />
              </label>
            ) : null}
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
                {moduleLabel(module)}
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
            <span>{role.modules.map(moduleLabel).join(", ")}</span>
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
  form: PurchaseRequestForm;
  setForm: (value: PurchaseRequestForm) => void;
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
          Judul PR *
          <input required onChange={(event) => setForm({ ...form, title: event.target.value })} value={form.title} />
        </label>
        <label>
          Departemen *
          <input required onChange={(event) => setForm({ ...form, department: event.target.value })} value={form.department} />
        </label>
        <label>
          Short Description *
          <input
            required
            maxLength={255}
            onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
            value={form.shortDescription}
          />
        </label>
        <label>
          Prioritas
          <select onChange={(event) => setForm({ ...form, priority: event.target.value })} value={form.priority}>
            <option>Normal</option>
            <option>Tinggi</option>
          </select>
        </label>
        <label className="full-field">
          Deskripsi Lengkap (Optional)
          <textarea
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={4}
            value={form.description}
          />
        </label>
      </div>
      <EditableItems items={items} setItems={setItems} />
      <ApprovalEditor approvals={approvalRows} hidePosition setApprovals={setApprovalRows} />
    </div>
  );
}

function EditableItems({ items, setItems }: { items: PurchaseItem[]; setItems: (items: PurchaseItem[]) => void }) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  return (
    <div className="sub-panel">
      <div className="panel-header compact-header">
        <h3>Items</h3>
        <button className="secondary-button small" onClick={() => setItems([...items, { ...blankItem }])} type="button">
          + Tambah Item
        </button>
      </div>
      <DataTable columns="1.8fr 0.8fr 1fr 80px">
        <TableHead cells={["Nama Item *", "Qty *", "Harga (Optional)", "Aksi"]} />
        {items.map((item, index) => (
          <div className="table-row" key={index}>
            <input
              required
              onChange={(event) => setItems(items.map((row, rowIndex) => (rowIndex === index ? { ...row, name: event.target.value } : row)))}
              value={item.name}
            />
            <input
              min="0.01"
              required
              step="any"
              onChange={(event) => setItems(items.map((row, rowIndex) => (rowIndex === index ? { ...row, quantity: event.target.value } : row)))}
              type="number"
              value={item.quantity}
            />
            <input
              min="0"
              step="any"
              onChange={(event) => setItems(items.map((row, rowIndex) => (rowIndex === index ? { ...row, unitPrice: event.target.value } : row)))}
              type="number"
              value={item.unitPrice}
            />
            <button className="icon-button danger" onClick={() => setDeleteIndex(index)} title="Hapus item" type="button">
              ×
            </button>
          </div>
        ))}
      </DataTable>
      {deleteIndex !== null ? (
        <ConfirmModal
          confirmLabel="Ya, Hapus Item"
          message={`Item ${items[deleteIndex]?.name || `baris ${deleteIndex + 1}`} akan dihapus dari Purchase Request.`}
          onClose={() => setDeleteIndex(null)}
          onConfirm={async () => {
            setItems(items.filter((_, rowIndex) => rowIndex !== deleteIndex));
            setDeleteIndex(null);
          }}
          title="Konfirmasi Hapus Item"
        />
      ) : null}
    </div>
  );
}

function ApprovalEditor({
  approvals,
  setApprovals,
  hidePosition = false
}: {
  approvals: ApprovalDraft[];
  setApprovals: (approvals: ApprovalDraft[]) => void;
  hidePosition?: boolean;
}) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  return (
    <div className="sub-panel">
      <div className="panel-header compact-header">
        <h3>Approval</h3>
        <button className="secondary-button small" onClick={() => setApprovals([...approvals, { ...blankApproval }])} type="button">
          + Tambah Approval
        </button>
      </div>
      {hidePosition ? <p className="muted">Gunakan email perusahaan. Email gratis tidak diperbolehkan.</p> : null}
      <DataTable columns={hidePosition ? "1.3fr 1.5fr 80px" : "1.2fr 1fr 1.3fr 80px"}>
        <TableHead cells={hidePosition ? ["Nama Approver", "Email Perusahaan", "Aksi"] : ["Nama Approver", "Jabatan", "Email", "Aksi"]} />
        {approvals.map((approval, index) => (
          <div className="table-row" key={index}>
            <input
              onChange={(event) =>
                setApprovals(approvals.map((row, rowIndex) => (rowIndex === index ? { ...row, approverName: event.target.value } : row)))
              }
              value={approval.approverName}
            />
            {!hidePosition ? (
              <input
                onChange={(event) =>
                  setApprovals(approvals.map((row, rowIndex) => (rowIndex === index ? { ...row, approverPosition: event.target.value } : row)))
                }
                value={approval.approverPosition}
              />
            ) : null}
            <input
              onChange={(event) =>
                setApprovals(approvals.map((row, rowIndex) => (rowIndex === index ? { ...row, approverEmail: event.target.value } : row)))
              }
              type="email"
              value={approval.approverEmail}
            />
            <button className="icon-button danger" onClick={() => setDeleteIndex(index)} title="Hapus approval" type="button">
              ×
            </button>
          </div>
        ))}
      </DataTable>
      {deleteIndex !== null ? (
        <ConfirmModal
          confirmLabel="Ya, Hapus Approval"
          message={`Approval ${approvals[deleteIndex]?.approverName || `baris ${deleteIndex + 1}`} akan dihapus.`}
          onClose={() => setDeleteIndex(null)}
          onConfirm={async () => {
            setApprovals(approvals.filter((_, rowIndex) => rowIndex !== deleteIndex));
            setDeleteIndex(null);
          }}
          title="Konfirmasi Hapus Approval"
        />
      ) : null}
    </div>
  );
}

function ResendApprovalModal({
  approvals,
  documentNumber,
  onClose,
  onResent
}: {
  approvals: ApprovalRow[];
  documentNumber: string;
  onClose: () => void;
  onResent: () => Promise<void>;
}) {
  const [sendingId, setSendingId] = useState("");
  const [error, setError] = useState("");

  async function resend(id: string) {
    setSendingId(id);
    setError("");
    try {
      await resendApproval(id);
      await onResent();
    } catch {
      setError("Email approval belum berhasil dikirim ulang. Silakan coba kembali.");
    } finally {
      setSendingId("");
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card resend-modal-card">
        <div className="panel-header">
          <div>
            <h2>Kirim Ulang Email Approval</h2>
            <p>{documentNumber} - pilih PIC yang masih menunggu respons.</p>
          </div>
          <button className="icon-button danger" onClick={onClose} title="Tutup" type="button">
            ×
          </button>
        </div>
        <div className="modal-body">
          {error ? <div className="alert">{error}</div> : null}
          <DataTable columns="1fr 1.4fr 0.8fr 70px">
            <TableHead cells={["PIC", "Email", "Status", "Aksi"]} />
            {approvals.map((approval) => (
              <div className="table-row" key={approval.id}>
                <strong>{approval.approverName}</strong>
                <span>{approval.approverEmail}</span>
                <StatusBadge status={approval.status} />
                <div className="action-row">
                  {approval.status === "waiting_response" ? (
                    <button
                      className="icon-button"
                      disabled={sendingId === approval.id}
                      onClick={() => void resend(approval.id)}
                      title="Kirim ulang email"
                      type="button"
                    >
                      ✉
                    </button>
                  ) : (
                    <span className="muted">-</span>
                  )}
                </div>
              </div>
            ))}
          </DataTable>
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose} type="button">
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}

function purchaseOrderRequests(po: PurchaseOrder) {
  return uniquePurchaseRequests(po.purchaseRequests?.length ? po.purchaseRequests : po.purchaseRequest ? [po.purchaseRequest] : []);
}

function purchaseOrderRequestNumbers(po: PurchaseOrder) {
  return purchaseOrderRequests(po).map((pr) => pr.documentNumber).join(", ") || "-";
}

function uniquePurchaseRequests(requests: PurchaseRequest[]) {
  return [...new Map(requests.map((pr) => [pr.id, pr])).values()];
}

function itemNameKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function aggregatePurchaseOrderItems(
  requests: PurchaseRequest[],
  existingItems: Array<PurchaseItem | PurchaseOrderItemDraft> = [],
  excludedKeys = new Set<string>(),
  includeOnlyExisting = false
): PurchaseOrderItemDraft[] {
  const sourceItems = new Map<string, { name: string; quantity: number; unitPrice: string }>();
  requests.flatMap((pr) => pr.items || []).forEach((item) => {
    const key = itemNameKey(item.name);
    const current = sourceItems.get(key);
    sourceItems.set(key, {
      name: current?.name || item.name,
      quantity: (current?.quantity || 0) + Number(item.quantity),
      unitPrice: current?.unitPrice || item.unitPrice
    });
  });
  const existingByName = new Map(existingItems.map((item) => [itemNameKey(item.name), item]));
  const itemKeys = includeOnlyExisting
    ? [...existingByName.keys()].filter((key) => sourceItems.has(key))
    : [...sourceItems.keys()].filter((key) => !excludedKeys.has(key));

  return itemKeys.map((key, index) => {
    const source = sourceItems.get(key)!;
    const existing = existingByName.get(key);
    const existingQuantity = Number(existing?.quantity || source.quantity);
    const wasUsingFullAvailableQuantity = Boolean(
      existing && "maxQuantity" in existing && existingQuantity === existing.maxQuantity
    );
    return {
      id: existing?.id,
      code: existing?.code || `POL-${String(index + 1).padStart(3, "0")}`,
      name: source.name,
      quantity: String(wasUsingFullAvailableQuantity ? source.quantity : Math.min(existingQuantity, source.quantity)),
      unitPrice: String(existing?.unitPrice ?? source.unitPrice ?? "0"),
      taxPercent: existing?.taxPercent,
      maxQuantity: source.quantity
    };
  });
}

function PurchaseOrderDetailContent({ purchaseOrder: po }: { purchaseOrder: PurchaseOrder }) {
  return (
    <div className="master-form">
      <div className="form-grid three">
        <label>Nomor PO<input readOnly value={po.documentNumber} /></label>
        <label>Nomor PR<input readOnly value={purchaseOrderRequestNumbers(po)} /></label>
        <label>Status<input readOnly value={po.status.replaceAll("_", " ")} /></label>
        <label>Vendor<input readOnly value={po.vendor?.name || "-"} /></label>
        <label>Short Description<input readOnly value={po.shortDescription || "-"} /></label>
        <label>Nilai Bersih<input readOnly value={money(po.netAmount)} /></label>
        <label className="full-field">Description<textarea readOnly rows={3} value={po.description || "-"} /></label>
        <label>PPN<input readOnly value={`${Number(po.taxPercent)}% / ${money(po.taxAmount)}`} /></label>
        <label>Total<input readOnly value={money(po.totalAmount)} /></label>
      </div>
      <ReadonlyItems items={po.items || []} taxPercent={Number(po.taxPercent || 0)} />
    </div>
  );
}

function PurchaseOrderDetailModal({ purchaseOrder, onClose }: { purchaseOrder: PurchaseOrder; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="panel-header">
          <div>
            <h2>Detail Purchase Order</h2>
            <p>{purchaseOrder.documentNumber}</p>
          </div>
          <button className="icon-button danger" onClick={onClose} title="Tutup" type="button">×</button>
        </div>
        <div className="modal-body"><PurchaseOrderDetailContent purchaseOrder={purchaseOrder} /></div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose} type="button">Tutup</button>
        </div>
      </section>
    </div>
  );
}

function DocumentDetailModal({ approval, onClose }: { approval: ApprovalRow; onClose: () => void }) {
  const document = approval.document;

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="panel-header">
          <div>
            <h2>Detail {approval.documentType === "PR" ? "Purchase Request" : "Purchase Order"}</h2>
            <p>{approval.documentNumber}</p>
          </div>
          <button className="icon-button danger" onClick={onClose} title="Tutup" type="button">
            ×
          </button>
        </div>
        <div className="modal-body">
          {!document ? <div className="alert">Detail dokumen belum tersedia.</div> : null}
          {document && approval.documentType === "PR" ? (() => {
            const pr = document as PurchaseRequest;
            return (
              <div className="master-form">
                <div className="form-grid three">
                  <label>Nomor PR<input readOnly value={pr.documentNumber} /></label>
                  <label>Status<input readOnly value={pr.status.replaceAll("_", " ")} /></label>
                  <label>Peminta<input readOnly value={pr.requester?.name || "-"} /></label>
                  <label>Judul PR<input readOnly value={pr.title} /></label>
                  <label>Departemen<input readOnly value={pr.department || "-"} /></label>
                  <label>Prioritas<input readOnly value={pr.priority || "-"} /></label>
                  <label className="full-field">Short Description<input readOnly value={pr.shortDescription || "-"} /></label>
                  <label className="full-field">Keterangan<textarea readOnly rows={3} value={pr.description || "-"} /></label>
                  <label>Total<input readOnly value={money(pr.totalAmount)} /></label>
                </div>
                <DataTable columns="1.8fr 0.6fr 1fr 1fr">
                  <TableHead cells={["Nama Barang / Jasa", "Qty", "Harga", "Total"]} />
                  {(pr.items || []).map((item) => (
                    <div className="table-row" key={item.id || item.name}>
                      <span>{item.name}</span>
                      <span>{Number(item.quantity).toLocaleString("id-ID")}</span>
                      <span>{money(item.unitPrice)}</span>
                      <strong>{money(Number(item.quantity) * Number(item.unitPrice))}</strong>
                    </div>
                  ))}
                </DataTable>
              </div>
            );
          })() : null}
          {document && approval.documentType === "PO" ? (() => {
            const po = document as PurchaseOrder;
            return <PurchaseOrderDetailContent purchaseOrder={po} />;
          })() : null}
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose} type="button">
            Tutup
          </button>
        </div>
      </section>
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

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card confirm-modal-card">
        <div className="panel-header">
          <div>
            <h2>{title}</h2>
            <p>Periksa kembali data sebelum melanjutkan tindakan.</p>
          </div>
          <button className="icon-button danger" onClick={onClose} title="Tutup" type="button">
            ×
          </button>
        </div>
        <div className="modal-body confirmation-copy">{message}</div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose} type="button">
            Kembali
          </button>
          <button className="danger-button" onClick={() => void onConfirm()} type="button">
            {confirmLabel}
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
  if (roles.some((role) => role.id === "administrator")) {
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
