const STORAGE_KEY = "erp-pt-kecil-v2";
const FINAL_APPROVAL_THRESHOLD = 50000000;
const PO_APPROVAL_THRESHOLD = 75000000;
const PAGE_SIZE = 10;
const DOCUMENT_NUMBER_RULES = {
  PR: { fixedCode: "21", sequenceLength: 5 },
  PO: { fixedCode: "22", sequenceLength: 5 }
};
const RECEIVE_BASIS_LABELS = {
  quantity: "Quantity",
  amount: "Nominal",
  deliverable: "Dokumen Deliverables"
};
const RECEIVE_KIND_LABELS = {
  goods: "Receiving Barang",
  service: "Receiving Jasa",
  mixed: "Receiving Barang & Jasa"
};

const coaMaster = [
  { code: "1101", name: "Persediaan Barang", kind: "non_asset" },
  { code: "1501", name: "Peralatan Kantor", kind: "asset" },
  { code: "1502", name: "Perangkat IT", kind: "asset" },
  { code: "5101", name: "Beban Alat Tulis Kantor", kind: "non_asset" },
  { code: "5204", name: "Beban Operasional Umum", kind: "non_asset" },
  { code: "2105", name: "GR/IR Clearing", kind: "liability" },
  { code: "2001", name: "Accounts Payable", kind: "liability" }
];

const moduleAccessByRole = {
  user_maker: ["dashboard", "purchase-request", "approval-queue"],
  procurement: ["dashboard", "purchase-request", "approval-queue", "purchase-order", "receive", "journal"],
  administrator: [
    "dashboard",
    "company-management",
    "user-management",
    "role-management",
    "master-vendor",
    "master",
    "purchase-request",
    "approval-queue",
    "purchase-order",
    "receive",
    "journal"
  ]
};

const roleLabels = {
  user_maker: "User Maker",
  procurement: "Procurement",
  administrator: "Administrator"
};

const moduleCatalog = [
  { id: "dashboard", label: "Dashboard", group: "Umum" },
  { id: "purchase-request", label: "Permintaan Barang", group: "Transaksi" },
  { id: "purchase-order", label: "Pesanan Pembelian", group: "Transaksi" },
  { id: "receive", label: "Penerimaan Barang", group: "Transaksi" },
  { id: "approval-queue", label: "Persetujuan", group: "Transaksi" },
  { id: "journal", label: "Jurnal Umum", group: "Akuntansi" },
  { id: "company-management", label: "Data Usaha", group: "Master" },
  { id: "user-management", label: "User Management", group: "Master" },
  { id: "role-management", label: "Roles Management", group: "Master" },
  { id: "master-vendor", label: "Master Vendor", group: "Master" },
  { id: "master", label: "Master Referensi", group: "Master" }
];

const defaultRoles = Object.entries(roleLabels).map(([id, name]) => ({
  id,
  name,
  modules: [...(moduleAccessByRole[id] || [])],
  status: "active"
}));

const seedState = {
  session: {
    isLoggedIn: false,
    userId: "",
    activeCompanyId: ""
  },
  counters: {
    pr: 3,
    po: 2,
    rcv: 2,
    journal: 2,
    company: 4,
    masterValue: 5,
    vendor: 3,
    user: 3
  },
  companies: [
    {
      id: "CMP-001",
      code: "CMP-HO",
      name: "PT Kecil HO",
      type: "Operasional",
      status: "active",
      isDefault: true,
      address: "Jl. Jenderal Sudirman No. 88, Jakarta Pusat"
    },
    {
      id: "CMP-002",
      code: "CMP-TRD",
      name: "PT Kecil Trading",
      type: "Trading",
      status: "active",
      isDefault: false,
      address: "Kawasan Industri MM2100 Blok C2, Bekasi"
    },
    {
      id: "CMP-003",
      code: "CMP-SVC",
      name: "PT Kecil Services",
      type: "Services",
      status: "active",
      isDefault: false,
      address: "Jl. Veteran No. 15, Surabaya"
    },
    {
      id: "CMP-004",
      code: "CMP-PRJ",
      name: "PT Kecil Project A",
      type: "Project",
      status: "inactive",
      isDefault: false,
      address: "Jl. Soekarno Hatta KM 12, Bandung"
    }
  ],
  vendors: [
    {
      id: "VND-001",
      companyId: "CMP-001",
      code: "VND-001",
      name: "PT Solusi Digital Nusantara",
      contactPerson: "Ayu Lestari",
      email: "sales@sdn.co.id",
      type: "Barang IT",
      status: "active",
      address: "Jl. Gatot Subroto Kav. 12, Jakarta Selatan",
      note: "Vendor utama perangkat IT"
    },
    {
      id: "VND-002",
      companyId: "CMP-001",
      code: "VND-002",
      name: "CV Alpha Teknologi",
      contactPerson: "Bagus Pratama",
      email: "hello@alphatek.id",
      type: "Barang / Jasa",
      status: "active",
      address: "Ruko Tekno Park Blok B7, Tangerang Selatan",
      note: "Alternatif vendor procurement umum"
    },
    {
      id: "VND-003",
      companyId: "CMP-002",
      code: "VND-003",
      name: "Toko Sinar Kantor",
      contactPerson: "Lina",
      email: "sales@sinarkantor.id",
      type: "ATK",
      status: "active",
      address: "Jl. Raya Industri No. 21, Bekasi",
      note: "Vendor operasional Trading"
    }
  ],
  roles: defaultRoles.map((role) => ({ ...role, modules: [...role.modules] })),
  masterCategories: [
    {
      id: "request_type",
      name: "Jenis Permintaan",
      description: "Kategori kebutuhan yang dipakai saat membuat PR.",
      values: [
        { id: "MST-001", code: "JNS-01", name: "Pengadaan Barang", status: "active" },
        { id: "MST-002", code: "JNS-02", name: "Pengadaan Jasa", status: "active" }
      ]
    },
    {
      id: "priority",
      name: "Prioritas Permintaan",
      description: "Menentukan urgensi permintaan dan perhatian approver.",
      values: [
        { id: "MST-003", code: "PRI-01", name: "Normal", status: "active" },
        { id: "MST-004", code: "PRI-02", name: "Tinggi", status: "active" },
        { id: "MST-005", code: "PRI-03", name: "Mendesak", status: "inactive" }
      ]
    }
  ],
  users: [
    {
      id: "USR-001",
      name: "Administrator ERP",
      email: "administrator@ptkecil.co.id",
      password: "Admin#2026",
      roles: ["administrator"],
      companyIds: ["CMP-001", "CMP-002", "CMP-003"],
      status: "active"
    },
    {
      id: "USR-002",
      name: "Mira Andini",
      email: "maker.ho@ptkecil.co.id",
      password: "Maker#2026",
      roles: ["user_maker"],
      companyIds: ["CMP-001"],
      status: "active"
    },
    {
      id: "USR-003",
      name: "Rudi Hartono",
      email: "procurement@ptkecil.co.id",
      password: "Proc#2026",
      roles: ["procurement"],
      companyIds: ["CMP-001", "CMP-002"],
      status: "active"
    }
  ],
  purchaseRequests: [
    {
      id: "PR-0001",
      companyId: "CMP-001",
      companyCode: "CMP-HO",
      title: "Pengadaan laptop tim finance",
      requester: "Nadia",
      department: "Finance",
      costCenter: "FIN-001",
      requestTypeId: "MST-001",
      priorityId: "MST-003",
      amount: 38000000,
      vendorSuggestion: "CV Alpha Teknologi",
      category: "asset",
      vatPercent: 11,
      vatAmount: 4180000,
      totalAmount: 42180000,
      coaCode: "1502",
      description: "2 unit laptop untuk closing dan rekonsiliasi bulanan.",
      status: "approved",
      approvalStage: "done",
      createdAt: "2026-04-28T10:00:00+07:00",
      history: ["Submitted oleh Nadia", "Approved Dept Head", "Approved final"]
    },
    {
      id: "PR-0002",
      companyId: "CMP-002",
      companyCode: "CMP-TRD",
      title: "ATK bulanan operasional",
      requester: "Rizal",
      department: "GA",
      costCenter: "GA-002",
      requestTypeId: "MST-001",
      priorityId: "MST-003",
      amount: 6500000,
      vendorSuggestion: "Toko Sinar Kantor",
      category: "non_asset",
      vatPercent: 11,
      vatAmount: 715000,
      totalAmount: 7215000,
      coaCode: "5101",
      description: "Kertas, tinta printer, dan alat tulis kantor.",
      status: "approved",
      approvalStage: "done",
      createdAt: "2026-04-29T09:30:00+07:00",
      history: ["Submitted oleh Rizal", "Approved Dept Head"]
    }
  ],
  purchaseOrders: [
      {
        id: "PO-0001",
        companyId: "CMP-001",
        companyCode: "CMP-HO",
        prId: "PR-0001",
        vendorName: "PT Solusi Digital Nusantara",
        paymentTerm: "30 hari",
        needBy: "2026-05-10",
        amount: 38000000,
        vatPercent: 11,
        vatAmount: 4180000,
        totalAmount: 42180000,
        status: "issued",
        createdAt: "2026-04-29T14:15:00+07:00",
        history: ["PO dibuat procurement", "PO issued ke vendor"]
      }
  ],
  receipts: [
    {
      id: "RCV-0001",
      companyId: "CMP-001",
      poId: "PO-0001",
      prId: "PR-0001",
      receiver: "Bimo",
      receiveType: "asset",
      receiveBasis: "quantity",
      documentRef: "BAST-001",
      note: "Laptop diterima lengkap, serial number tercatat.",
      amount: 38000000,
      createdAt: "2026-04-30T11:00:00+07:00",
      assetNumber: "AST-2026-0001"
    }
  ],
  journals: [
    {
      id: "JRN-0001",
      companyId: "CMP-001",
      sourceId: "RCV-0001",
      createdAt: "2026-04-30T11:00:00+07:00",
      lines: [
        { account: "1502 - Perangkat IT", type: "Debit", amount: 38000000 },
        { account: "2105 - GR/IR Clearing", type: "Credit", amount: 38000000 }
      ]
    }
  ]
};

const ui = {
  activeSection: "dashboard",
  prFormOpen: false,
  prDraftItems: [],
  editingPrItemIndex: -1,
  prDraftApprovers: [],
  editingPrApproverIndex: -1,
  poDraftItems: [],
  poDraftApprovers: [],
  editingPoApproverIndex: -1,
  poDraftQuotations: [],
  editingPoQuotationIndex: -1,
  poFormOpen: false,
  selectedPoDetailPrId: "",
  selectedPoCreatePrId: "",
  editingPrId: "",
  selectedPrDetailId: "",
  prSearch: "",
  prPage: 1,
  poSearch: "",
  poPage: 1,
  approvalPrSearch: "",
  approvalPrPage: 1,
  approvalPoSearch: "",
  approvalPoPage: 1,
  receiveFormOpen: false,
  selectedReceivePoId: "",
  receiveBasis: "quantity",
  receivePage: 1,
  editingCompanyId: "",
  companyFormOpen: false,
  editingUserId: "",
  userFormOpen: false,
  selectedRoleId: "user_maker",
  editingVendorId: "",
  vendorFormOpen: false,
  selectedMasterCategoryId: "request_type",
  editingReferenceValueId: "",
  masterSearch: "",
  masterStatusFilter: "all",
  masterCategoryFilter: "all",
  referenceEditorOpen: false
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return normalizeDocumentCompanyCodes(structuredClone(seedState));
  }

  const parsed = JSON.parse(saved);
  const baseState = structuredClone(seedState);
  return normalizeDocumentCompanyCodes({
    ...baseState,
    ...parsed,
    session: { ...baseState.session, ...parsed.session },
    counters: { ...baseState.counters, ...parsed.counters }
  });
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function clampPage(page, totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  return Math.min(Math.max(1, Number(page) || 1), totalPages);
}

function paginateItems(items, page) {
  const currentPage = clampPage(page, items.length);
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    currentPage,
    totalPages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
    totalItems: items.length,
    items: items.slice(start, start + PAGE_SIZE)
  };
}

function renderPagination(listId, pageInfo) {
  const start = pageInfo.totalItems ? (pageInfo.currentPage - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(pageInfo.currentPage * PAGE_SIZE, pageInfo.totalItems);

  return `
    <div class="pagination-bar">
      <span>Menampilkan ${start}-${end} dari ${pageInfo.totalItems} data</span>
      <div class="pagination-actions">
        <button class="mini-button" data-action="paginate-list" data-list="${listId}" data-page="${pageInfo.currentPage - 1}" type="button" ${pageInfo.currentPage <= 1 ? "disabled" : ""}>Prev</button>
        <span class="pagination-page">Halaman ${pageInfo.currentPage} / ${pageInfo.totalPages}</span>
        <button class="mini-button" data-action="paginate-list" data-list="${listId}" data-page="${pageInfo.currentPage + 1}" type="button" ${pageInfo.currentPage >= pageInfo.totalPages ? "disabled" : ""}>Next</button>
      </div>
    </div>
  `;
}

function nextId(prefix, key) {
  state.counters[key] += 1;
  return `${prefix}-${String(state.counters[key]).padStart(4, "0")}`;
}

function formatDocumentDateToken(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function formatDocumentYearToken(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return String(date.getFullYear()).slice(-2);
}

function getCompanyCodeSnapshot(companyId, sourceState = state) {
  return String(sourceState.companies.find((item) => item.id === companyId)?.code || "CMP").trim().toUpperCase();
}

function normalizeDocumentCompanyCodes(nextState) {
  ["purchaseRequests", "purchaseOrders"].forEach((collectionKey) => {
    if (!Array.isArray(nextState[collectionKey])) {
      return;
    }

    nextState[collectionKey] = nextState[collectionKey].map((item) => ({
      ...item,
      companyCode: item.companyCode || getCompanyCodeSnapshot(item.companyId, nextState)
    }));
  });

  return nextState;
}

function buildDocumentNumber(companyId, moduleCode, createdAt, collection) {
  const rule = DOCUMENT_NUMBER_RULES[moduleCode];
  if (rule) {
    const prefix = `${formatDocumentYearToken(createdAt)}${rule.fixedCode}`;
    const lastSequence = collection.reduce((highest, item) => {
      const documentId = String(item.id || "");
      if (item.companyId !== companyId || !documentId.startsWith(prefix)) {
        return highest;
      }

      const sequence = Number(documentId.slice(prefix.length));
      return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
    }, 0);
    const nextSequence = lastSequence + 1;
    return `${prefix}${String(nextSequence).padStart(rule.sequenceLength, "0")}`;
  }

  const companyCode = getCompanyCodeSnapshot(companyId);
  const dateToken = formatDocumentDateToken(createdAt);
  const prefix = `${companyCode}-${moduleCode}-${dateToken}-`;
  const sameSeries = collection.filter((item) => {
    if (item.companyId !== companyId) {
      return false;
    }

    return String(item.id || "").startsWith(prefix);
  });

  const nextSequence = sameSeries.length + 1;
  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

function activeCompanies() {
  return state.companies.filter((item) => item.status === "active");
}

function getCurrentUser() {
  return state.users.find((item) => item.id === state.session.userId) || null;
}

function getUserById(id) {
  return state.users.find((item) => item.id === id);
}

function getRoleById(id) {
  return state.roles?.find((item) => item.id === id) || defaultRoles.find((item) => item.id === id);
}

function activeRoles() {
  return (state.roles || defaultRoles).filter((role) => role.status !== "inactive");
}

function roleLabel(roleId) {
  return getRoleById(roleId)?.name || roleLabels[roleId] || roleId;
}

function roleModules(roleId) {
  return getRoleById(roleId)?.modules || moduleAccessByRole[roleId] || [];
}

function getCurrentCompany() {
  return state.companies.find((item) => item.id === state.session.activeCompanyId) || null;
}

function getCompanyById(id) {
  return state.companies.find((item) => item.id === id);
}

function getVendorById(id) {
  return state.vendors.find((item) => item.id === id);
}

function getMasterCategoryById(id) {
  return state.masterCategories.find((item) => item.id === id);
}

function findCategoryByValueId(valueId) {
  return state.masterCategories.find((category) => category.values.some((item) => item.id === valueId)) || null;
}

function getMasterValue(categoryId, valueId) {
  const category = getMasterCategoryById(categoryId);
  return category?.values.find((item) => item.id === valueId) || null;
}

function getMasterValueName(categoryId, valueId) {
  return getMasterValue(categoryId, valueId)?.name || "-";
}

function getCoaByCode(code) {
  return coaMaster.find((item) => item.code === code);
}

function getPrById(id, companyId = state.session.activeCompanyId) {
  return (
    state.purchaseRequests.find((item) => item.id === id && (!companyId || item.companyId === companyId)) ||
    state.purchaseRequests.find((item) => item.id === id)
  );
}

function getPoById(id, companyId = state.session.activeCompanyId) {
  return (
    state.purchaseOrders.find((item) => item.id === id && (!companyId || item.companyId === companyId)) ||
    state.purchaseOrders.find((item) => item.id === id)
  );
}

function activeVendors() {
  return companyScoped(state.vendors).filter((item) => item.status === "active");
}

function getUserRoleLabels(user = getCurrentUser()) {
  if (!user) {
    return [];
  }

  return user.roles.map((role) => roleLabel(role));
}

function userHasRole(role, user = getCurrentUser()) {
  return Boolean(user && user.roles.includes(role));
}

function userModules(user = getCurrentUser()) {
  if (!user) {
    return [];
  }

  return [...new Set(user.roles.flatMap((role) => roleModules(role)))];
}

function canAccessSection(sectionId) {
  if (sectionId === "dashboard") {
    return true;
  }

  return userModules().includes(sectionId);
}

function companyScoped(items) {
  return items.filter((item) => item.companyId === state.session.activeCompanyId);
}

function pendingApprover(pr) {
  if (pr.status === "submitted") {
    return "Dept Head";
  }

  if (pr.status === "waiting_finance") {
    return "Finance / Direktur";
  }

  return "Selesai";
}

function getCurrentApprovalEntry(type, document) {
  const approvals = Array.isArray(document.approvalSetup) ? document.approvalSetup : [];
  if (!approvals.length) {
    return null;
  }

  if (type === "pr") {
    if (document.status === "submitted") {
      return approvals[0] || null;
    }

    if (document.status === "waiting_finance") {
      return approvals[1] || approvals[approvals.length - 1] || null;
    }
  }

  if (type === "po" && document.status === "waiting_approval") {
    return approvals[0] || null;
  }

  return approvals[0] || null;
}

function getCurrentApprovalIndex(type, document) {
  const approvals = Array.isArray(document.approvalSetup) ? document.approvalSetup : [];
  if (!approvals.length) {
    return -1;
  }

  if (type === "pr") {
    if (document.status === "submitted") {
      return 0;
    }

    if (document.status === "waiting_finance") {
      return approvals.length > 1 ? 1 : 0;
    }
  }

  if (type === "po" && document.status === "waiting_approval") {
    return 0;
  }

  return -1;
}

function getApprovalRowStageLabel(type, document, index) {
  const currentIndex = getCurrentApprovalIndex(type, document);

  if (document.status === "rejected") {
    return index === currentIndex || currentIndex === -1 ? "Rejected" : "Closed";
  }

  if (document.status === "approved" || document.status === "issued") {
    return "Approved";
  }

  if (document.status === "waiting_finance" && type === "pr") {
    if (index === 0) {
      return "Approved";
    }
    if (index === 1) {
      return "Menunggu Respon";
    }
  }

  if (index === currentIndex) {
    return "Menunggu Respon";
  }

  if (currentIndex >= 0 && index < currentIndex) {
    return "Approved";
  }

  return "Menunggu Tahap";
}

function formatApprovalEmailStatus(entry) {
  if (!entry?.lastEmailSentAt) {
    return "Email approval mengikuti data awal dokumen.";
  }

  return `Terakhir dikirim ulang ${formatDate(entry.lastEmailSentAt)}`;
}

function renderApprovalApproverRows(type, document) {
  const approvals = Array.isArray(document.approvalSetup) ? document.approvalSetup : [];

  if (!approvals.length) {
    return `<div class="empty-state">Belum ada approver manual pada dokumen ini.</div>`;
  }

  return approvals
    .map(
      (entry, index) => `
        <div class="approval-approver-row">
          <div>
            <strong>${entry.name || "-"}</strong>
            <p>${entry.title || "-"} | ${entry.email || "-"}</p>
            <p>${formatApprovalEmailStatus(entry)}</p>
          </div>
          <button
            class="mini-button"
            data-action="resend-approval-email"
            data-type="${type}"
            data-id="${document.id}"
            data-index="${index}"
            type="button"
          >
            Send Ulang Email
          </button>
        </div>
      `
    )
    .join("");
}

function prStatusBadge(status) {
  const map = {
    submitted: "Menunggu Dept Head",
    waiting_finance: "Menunggu Finance",
    approved: "Approved",
    rejected: "Rejected"
  };
  return map[status] || status;
}

function poStatusBadge(po) {
  if (!po) {
    return "";
  }

  const map = {
    issued: "PO Issued",
    waiting_approval: "PO Menunggu Approval",
    rejected: "PO Rejected",
    partial_received: "PO Partial Received",
    received: "PO Received"
  };
  return `${map[po.status] || po.status} (${po.id})`;
}

function poStatusClass(po) {
  if (!po) {
    return "muted";
  }

  if (po.status === "rejected") {
    return "danger";
  }

  if (["issued", "partial_received", "received"].includes(po.status)) {
    return "ok";
  }

  return "muted";
}

function getLatestPoByPrId(prId) {
  return companyScoped(state.purchaseOrders)
    .filter((item) => item.prId === prId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
}

function getReceiptNumbersByPoId(poId) {
  return companyScoped(state.receipts)
    .filter((item) => item.poId === poId)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .map((item) => item.id);
}

function companyStatusLabel(status) {
  return status === "active" ? "Aktif" : "Nonaktif";
}

function safeCurrentCompany(user = getCurrentUser()) {
  if (!user) {
    return null;
  }

  const allowed = activeCompanies().filter((company) => user.companyIds.includes(company.id));
  if (!allowed.length) {
    return null;
  }

  if (!allowed.some((company) => company.id === state.session.activeCompanyId)) {
    state.session.activeCompanyId = allowed[0].id;
  }

  return getCurrentCompany();
}

function renderLoginCompanies() {
  const select = document.getElementById("login-company");
  select.innerHTML = activeCompanies()
    .map((company) => `<option value="${company.id}">${company.name}</option>`)
    .join("");
}

function renderShellVisibility() {
  const loggedIn = state.session.isLoggedIn && getCurrentUser() && safeCurrentCompany();
  document.getElementById("login-screen").classList.toggle("app-hidden", Boolean(loggedIn));
  document.getElementById("app-shell").classList.toggle("app-hidden", !loggedIn);
}

function renderSessionSummary() {
  const user = getCurrentUser();
  const company = getCurrentCompany();
  const container = document.getElementById("session-summary");

  if (!user || !company) {
    container.innerHTML = `<div class="empty-state">Belum login.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="stack-item slim">
      <strong>${user.name}</strong>
      <p>${user.email}</p>
      <div class="inline-tags">
        <span class="tag">${company.name}</span>
        ${getUserRoleLabels(user).map((role) => `<span class="tag">${role}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderPageHeader() {
  const section = document.getElementById(ui.activeSection);
  const company = getCurrentCompany();
  const user = getCurrentUser();

  if (!section || !company || !user) {
    return;
  }

  const breadcrumb = document.getElementById("page-breadcrumb");
  const title = document.getElementById("page-title");
  const subtitle = document.getElementById("page-subtitle");
  const periodChip = document.getElementById("period-chip");
  const roleChip = document.getElementById("role-chip");
  const period = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());

  breadcrumb.textContent = section.dataset.breadcrumb || "ERP / Dashboard";
  title.textContent = section.dataset.title || "Dashboard";
  subtitle.textContent = section.dataset.subtitle || "";
  periodChip.textContent = `Periode: ${period}`;
  roleChip.textContent = getUserRoleLabels(user)[0] || "User";
}

function renderCompanySwitcher() {
  const select = document.getElementById("company-switcher");
  const user = getCurrentUser();

  if (!user) {
    select.innerHTML = "";
    return;
  }

  const options = activeCompanies().filter((company) => user.companyIds.includes(company.id));
  select.innerHTML = options.map((company) => `<option value="${company.id}">${company.name}</option>`).join("");
  select.value = state.session.activeCompanyId || options[0]?.id || "";
}

function setActiveSection(sectionId) {
  ui.activeSection = canAccessSection(sectionId) ? sectionId : "dashboard";

  document.querySelectorAll(".nav-link").forEach((button) => {
    const isActive = button.dataset.section === ui.activeSection;
    button.classList.toggle("active", isActive);
  });

  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("active", section.id === ui.activeSection);
  });

  renderPageHeader();
}

function renderNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    const section = button.dataset.section;
    const allowed = canAccessSection(section);
    button.hidden = !allowed;
    button.disabled = !allowed;
  });

  if (!canAccessSection(ui.activeSection)) {
    ui.activeSection = "dashboard";
  }

  setActiveSection(ui.activeSection);
}

function renderStats() {
  const prs = companyScoped(state.purchaseRequests);
  const pos = companyScoped(state.purchaseOrders);
  const journals = companyScoped(state.journals);
  const cards = [
    {
      title: "Open PR",
      value: prs.filter((item) => ["submitted", "waiting_finance"].includes(item.status)).length,
      note: "Pengajuan yang masih menunggu approval"
    },
    {
      title: "Approved PR",
      value: prs.filter((item) => item.status === "approved").length,
      note: "Siap diproses menjadi PO"
    },
    {
      title: "Open PO",
      value: pos.filter((item) => ["waiting_approval", "issued"].includes(item.status)).length,
      note: "PO aktif menunggu kirim atau receive"
    },
    {
      title: "Jurnal Receive",
      value: journals.length,
      note: "Posting otomatis di company aktif"
    }
  ];

  document.getElementById("stats").innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <h3>${card.title}</h3>
          <strong>${card.value}</strong>
          <p>${card.note}</p>
        </article>
      `
    )
    .join("");
}

function renderDashboardPrPoList() {
  const container = document.getElementById("dashboard-pr-po-list");
  const prs = companyScoped(state.purchaseRequests);

  if (!container) {
    return;
  }

  if (!prs.length) {
    container.innerHTML = `<div class="empty-state">Belum ada relasi PR dan PO di company aktif.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="pr-list-table dashboard-relation-table">
      <div class="pr-list-table-head dashboard-relation-head">
        <span>Nomor PR</span>
        <span>Status PR</span>
        <span>Nomor PO</span>
        <span>Nomor Receive</span>
        <span>Status PO</span>
        <span>Departemen</span>
        <span>Peminta</span>
        <span>Nilai PR</span>
        <span>Total PO</span>
        <span>Vendor</span>
        <span>Judul / Keterangan</span>
      </div>
      ${prs
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map((pr) => {
          const po = getLatestPoByPrId(pr.id);
          const receiptNumbers = po ? getReceiptNumbersByPoId(po.id) : [];
          return `
            <div class="pr-list-table-row dashboard-relation-row">
              <span class="pr-list-cell pr-list-emphasis">${pr.id}</span>
              <span class="pr-list-cell status-text ${pr.status === "approved" ? "ok" : pr.status === "rejected" ? "danger" : "muted"}">${prStatusBadge(pr.status)}</span>
              <span class="pr-list-cell pr-list-emphasis">${po?.id || "-"}</span>
              <span class="pr-list-cell pr-list-emphasis">${receiptNumbers.length ? receiptNumbers.join(", ") : "-"}</span>
              <span class="pr-list-cell status-text ${po ? poStatusClass(po) : "muted"}">${po ? poStatusBadge(po).replace(` (${po.id})`, "") : "Belum ada PO"}</span>
              <span class="pr-list-cell">${pr.department || "-"}</span>
              <span class="pr-list-cell">${pr.requester || "-"}</span>
              <span class="pr-list-cell pr-list-emphasis">${currency(pr.amount || 0)}</span>
              <span class="pr-list-cell pr-list-emphasis">${po ? currency(po.totalAmount || po.amount || 0) : "-"}</span>
              <span class="pr-list-cell">${po?.vendorName || "-"}</span>
              <span class="pr-list-cell pr-list-title">${pr.title || "-"}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCoaOptions() {
  const select = document.getElementById("coa-select");
  if (!select) {
    return;
  }
  select.innerHTML = coaMaster
    .filter((item) => item.kind !== "liability")
    .map((item) => `<option value="${item.code}">${item.code} - ${item.name}</option>`)
    .join("");
}

function renderMasterReferenceOptions() {
  const requestTypeSelect = document.getElementById("request-type-select");
  const prioritySelect = document.getElementById("priority-select");
  const vendorSuggestionSelect = document.getElementById("vendor-suggestion-select");
  const vendorFinalSelect = document.getElementById("vendor-final-select");
  const requestTypeCategory = getMasterCategoryById("request_type");
  const priorityCategory = getMasterCategoryById("priority");
  const vendorOptions = activeVendors();

  requestTypeSelect.innerHTML = requestTypeCategory.values
    .filter((item) => item.status === "active")
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");

  prioritySelect.innerHTML = priorityCategory.values
    .filter((item) => item.status === "active")
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");

  const vendorMarkup = vendorOptions.length
    ? vendorOptions.map((item) => `<option value="${item.id}">${item.code} - ${item.name}</option>`).join("")
    : `<option value="">Belum ada vendor aktif di company ini</option>`;

  if (vendorSuggestionSelect) {
    vendorSuggestionSelect.innerHTML = vendorMarkup;
  }

  if (vendorFinalSelect) {
    vendorFinalSelect.innerHTML = vendorMarkup;
  }
}

function renderPrForm() {
  const panel = document.getElementById("pr-form-panel");
  const list = document.getElementById("pr-list");
  const detail = document.getElementById("pr-detail-panel");
  panel.classList.toggle("app-hidden", !ui.prFormOpen);
  list.classList.toggle("app-hidden", ui.prFormOpen);
  detail.classList.toggle("app-hidden", ui.prFormOpen || !ui.selectedPrDetailId);

  if (ui.prFormOpen) {
    renderPrDraftPreview();
    renderPrApproverPreview();
  }
}

function getPrDraftTotal() {
  return ui.prDraftItems.reduce((total, item) => total + getItemNetAmount(item), 0);
}

function getItemVatPercent(item, fallback = 0) {
  const rawValue = Number(item?.vatPercent ?? fallback ?? 0);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
}

function getItemNetAmount(item) {
  return Math.max(0, Number(item?.qty || 0)) * Math.max(0, Number(item?.price || 0));
}

function getItemVatAmount(item, fallback = 0) {
  return getItemNetAmount(item) * (getItemVatPercent(item, fallback) / 100);
}

function getItemGrandTotal(item, fallback = 0) {
  return getItemNetAmount(item) + getItemVatAmount(item, fallback);
}

function getSharedItemVatPercent(items) {
  const rates = [...new Set((items || []).map((item) => getItemVatPercent(item)).filter((value) => value > 0))];
  return rates.length === 1 ? rates[0] : 0;
}

function getPrDraftCategoryValue() {
  const categories = [...new Set(ui.prDraftItems.map((item) => item.category))];
  if (!categories.length) {
    return "asset";
  }

  return categories.length === 1 ? categories[0] : "mixed";
}

function getPrDraftCategoryLabel() {
  const category = getPrDraftCategoryValue();
  if (category === "non_asset") {
    return "Non-Asset";
  }

  if (category === "mixed") {
    return "Campuran";
  }

  return "Asset";
}

function getEditablePrItems(pr) {
  if (Array.isArray(pr.items) && pr.items.length) {
    return pr.items.map((item) => ({
      ...item,
      vatPercent: 0
    }));
  }

  return [
    {
      name: pr.title,
      qty: 1,
      price: pr.amount,
      vatPercent: 0,
      category: pr.category === "mixed" ? "asset" : pr.category,
      description: pr.description || ""
    }
  ];
}

function getEditablePrApprovers(pr) {
  if (Array.isArray(pr.approvalSetup) && pr.approvalSetup.length) {
    return pr.approvalSetup.map((item) => ({ ...item }));
  }

  return [];
}

function renderPrDraftPreview() {
  const previewBody = document.getElementById("pr-preview-body");
  const itemCount = document.getElementById("pr-item-count");
  const itemTotal = document.getElementById("pr-item-total");
  const addItemButton = document.getElementById("pr-add-item");

  if (!previewBody || !itemCount || !itemTotal || !addItemButton) {
    return;
  }

  itemCount.textContent = `${ui.prDraftItems.length} item`;
  itemTotal.textContent = currency(getPrDraftTotal());
  addItemButton.textContent = ui.editingPrItemIndex >= 0 ? "Update Item" : "Tambah Item";

  if (!ui.prDraftItems.length) {
    previewBody.innerHTML = `
      <div class="master-table-row pr-preview-row pr-preview-empty">
        <span>PRV-001</span>
        <span>Belum ada item</span>
        <span>0</span>
        <span>Rp 0</span>
        <span>-</span>
        <span>User Request</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  previewBody.innerHTML = ui.prDraftItems
    .map(
      (item, index) => `
        <div class="master-table-row pr-preview-row">
          <span>PRV-${String(index + 1).padStart(3, "0")}</span>
          <span>${item.name}</span>
          <span>${item.qty}</span>
          <span>${currency(item.price)}</span>
          <span>${item.category === "non_asset" ? "Non-Asset" : "Asset"}</span>
          <span>User Request</span>
          <span class="icon-group">
            <button class="icon-button" title="Edit item" data-action="edit-pr-item" data-id="${index}" type="button">&#9998;</button>
            <button class="icon-button" title="Hapus item" data-action="delete-pr-item" data-id="${index}" type="button">&#128465;</button>
          </span>
        </div>
      `
    )
    .join("");
}

function renderPrApproverPreview() {
  const approvalBody = document.getElementById("pr-approval-body");
  const approverCount = document.getElementById("pr-approver-count");
  const addApproverButton = document.getElementById("pr-add-approver");

  if (!approvalBody || !approverCount || !addApproverButton) {
    return;
  }

  approverCount.textContent = `${ui.prDraftApprovers.length} approver`;
  addApproverButton.textContent =
    ui.editingPrApproverIndex >= 0 ? "Update Approval" : "Tambah Approval";

  if (!ui.prDraftApprovers.length) {
    approvalBody.innerHTML = `
      <div class="master-table-row pr-approval-row-display pr-preview-empty">
        <span>1</span>
        <span>Belum ada approver</span>
        <span>-</span>
        <span>-</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  approvalBody.innerHTML = ui.prDraftApprovers
    .map(
      (item, index) => `
        <div class="master-table-row pr-approval-row-display">
          <span>${index + 1}</span>
          <span>${item.name || "-"}</span>
          <span>${item.title || "-"}</span>
          <span>${item.email || "-"}</span>
          <span class="icon-group">
            <button class="icon-button" title="Edit approval" data-action="edit-pr-approver" data-id="${index}" type="button">&#9998;</button>
            <button class="icon-button" title="Hapus approval" data-action="delete-pr-approver" data-id="${index}" type="button">&#128465;</button>
          </span>
        </div>
      `
    )
    .join("");
}

function resetPrItemFields() {
  const form = document.getElementById("pr-form");
  if (!form) {
    return;
  }

  form.elements.namedItem("itemName").value = "";
  form.elements.namedItem("itemQty").value = "";
  form.elements.namedItem("itemPrice").value = "";
  form.elements.namedItem("itemCategory").value = "asset";
  form.elements.namedItem("itemDescription").value = "";
  ui.editingPrItemIndex = -1;
}

function resetPrApproverFields() {
  const form = document.getElementById("pr-form");
  if (!form) {
    return;
  }

  ui.editingPrApproverIndex = -1;
  form.elements.namedItem("approverName").value = "";
  form.elements.namedItem("approverTitle").value = "";
  form.elements.namedItem("approverEmail").value = "";
}

function addPrDraftItem(event) {
  if (event) {
    event.preventDefault();
  }

  const form = document.getElementById("pr-form");
  if (!form) {
    return;
  }

  const nameField = form.querySelector('[name="itemName"]');
  const qtyField = form.querySelector('[name="itemQty"]');
  const priceField = form.querySelector('[name="itemPrice"]');
  const categoryField = form.querySelector('[name="itemCategory"]');
  const descriptionField = form.querySelector('[name="itemDescription"]');

  const name = String(nameField?.value || "").trim();
  const qty = Math.max(1, Number(qtyField?.value || 1));
  const price = Math.max(0, Number(priceField?.value || 0));
  const category = String(categoryField?.value || "asset");
  const description = String(descriptionField?.value || "").trim();

  if (!name) {
    return;
  }

  const payload = {
    name,
    qty,
    price,
    category,
    description
  };

  if (ui.editingPrItemIndex >= 0 && ui.prDraftItems[ui.editingPrItemIndex]) {
    ui.prDraftItems[ui.editingPrItemIndex] = payload;
  } else {
    ui.prDraftItems.push(payload);
  }

  resetPrItemFields();
  renderPrDraftPreview();
  nameField?.focus();
}

function beginEditPrItem(index) {
  const item = ui.prDraftItems[index];
  const form = document.getElementById("pr-form");

  if (!item || !form) {
    return;
  }

  ui.editingPrItemIndex = index;
  form.querySelector('[name="itemName"]').value = item.name || "";
  form.querySelector('[name="itemQty"]').value = item.qty || "";
  form.querySelector('[name="itemPrice"]').value = item.price || "";
  form.querySelector('[name="itemCategory"]').value = item.category || "asset";
  form.querySelector('[name="itemDescription"]').value = item.description || "";
  renderPrDraftPreview();
  form.querySelector('[name="itemName"]').focus();
}

function deletePrDraftItem(index) {
  if (!ui.prDraftItems[index]) {
    return;
  }

  ui.prDraftItems.splice(index, 1);

  if (ui.editingPrItemIndex === index) {
    resetPrItemFields();
  } else if (ui.editingPrItemIndex > index) {
    ui.editingPrItemIndex -= 1;
  }

  renderPrDraftPreview();
}

function addPrDraftApprover(event) {
  if (event) {
    event.preventDefault();
  }

  const form = document.getElementById("pr-form");
  if (!form) {
    return;
  }

  const nameField = form.querySelector('[name="approverName"]');
  const titleField = form.querySelector('[name="approverTitle"]');
  const emailField = form.querySelector('[name="approverEmail"]');

  const name = String(nameField?.value || "").trim();
  const title = String(titleField?.value || "").trim();
  const email = String(emailField?.value || "").trim();

  if (!name) {
    return;
  }

  const payload = { name, title, email };

  if (
    ui.editingPrApproverIndex >= 0 &&
    ui.editingPrApproverIndex < ui.prDraftApprovers.length
  ) {
    ui.prDraftApprovers[ui.editingPrApproverIndex] = payload;
  } else {
    ui.prDraftApprovers.push(payload);
  }

  resetPrApproverFields();
  renderPrApproverPreview();
  nameField?.focus();
}

function beginEditPrApprover(index) {
  const approver = ui.prDraftApprovers[index];
  const form = document.getElementById("pr-form");

  if (!approver || !form) {
    return;
  }

  ui.editingPrApproverIndex = index;
  form.querySelector('[name="approverName"]').value = approver.name || "";
  form.querySelector('[name="approverTitle"]').value = approver.title || "";
  form.querySelector('[name="approverEmail"]').value = approver.email || "";
  renderPrApproverPreview();
  form.querySelector('[name="approverName"]').focus();
}

function deletePrDraftApprover(index) {
  if (!ui.prDraftApprovers[index]) {
    return;
  }

  ui.prDraftApprovers.splice(index, 1);

  if (ui.editingPrApproverIndex === index) {
    resetPrApproverFields();
  } else if (ui.editingPrApproverIndex > index) {
    ui.editingPrApproverIndex -= 1;
  }

  renderPrApproverPreview();
}

function renderPoApproverPreview() {
  const approvalBody = document.getElementById("po-approval-body");
  const approverCount = document.getElementById("po-approver-count");
  const addApproverButton = document.getElementById("po-add-approver");

  if (!approvalBody || !approverCount || !addApproverButton) {
    return;
  }

  approverCount.textContent = `${ui.poDraftApprovers.length} approver`;
  addApproverButton.textContent =
    ui.editingPoApproverIndex >= 0 ? "Update Approval" : "Tambah Approval";

  if (!ui.poDraftApprovers.length) {
    approvalBody.innerHTML = `
      <div class="master-table-row pr-approval-row-display pr-preview-empty">
        <span>1</span>
        <span>Belum ada approver</span>
        <span>-</span>
        <span>-</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  approvalBody.innerHTML = ui.poDraftApprovers
    .map(
      (item, index) => `
        <div class="master-table-row pr-approval-row-display">
          <span>${index + 1}</span>
          <span>${item.name || "-"}</span>
          <span>${item.title || "-"}</span>
          <span>${item.email || "-"}</span>
          <span class="icon-group">
            <button class="icon-button" title="Edit approval" data-action="edit-po-approver" data-id="${index}" type="button">&#9998;</button>
            <button class="icon-button" title="Hapus approval" data-action="delete-po-approver" data-id="${index}" type="button">&#128465;</button>
          </span>
        </div>
      `
    )
    .join("");
}

function resetPoApproverFields() {
  const form = document.getElementById("po-form");
  if (!form) {
    return;
  }

  ui.editingPoApproverIndex = -1;
  form.elements.namedItem("poApproverName").value = "";
  form.elements.namedItem("poApproverTitle").value = "";
  form.elements.namedItem("poApproverEmail").value = "";
}

function addPoDraftApprover(event) {
  if (event) {
    event.preventDefault();
  }

  const form = document.getElementById("po-form");
  if (!form) {
    return;
  }

  const nameField = form.querySelector('[name="poApproverName"]');
  const titleField = form.querySelector('[name="poApproverTitle"]');
  const emailField = form.querySelector('[name="poApproverEmail"]');

  const name = String(nameField?.value || "").trim();
  const title = String(titleField?.value || "").trim();
  const email = String(emailField?.value || "").trim();

  if (!name) {
    return;
  }

  const payload = { name, title, email };

  if (
    ui.editingPoApproverIndex >= 0 &&
    ui.editingPoApproverIndex < ui.poDraftApprovers.length
  ) {
    ui.poDraftApprovers[ui.editingPoApproverIndex] = payload;
  } else {
    ui.poDraftApprovers.push(payload);
  }

  resetPoApproverFields();
  renderPoApproverPreview();
  nameField?.focus();
}

function beginEditPoApprover(index) {
  const approver = ui.poDraftApprovers[index];
  const form = document.getElementById("po-form");

  if (!approver || !form) {
    return;
  }

  ui.editingPoApproverIndex = index;
  form.querySelector('[name="poApproverName"]').value = approver.name || "";
  form.querySelector('[name="poApproverTitle"]').value = approver.title || "";
  form.querySelector('[name="poApproverEmail"]').value = approver.email || "";
  renderPoApproverPreview();
  form.querySelector('[name="poApproverName"]').focus();
}

function deletePoDraftApprover(index) {
  if (!ui.poDraftApprovers[index]) {
    return;
  }

  ui.poDraftApprovers.splice(index, 1);

  if (ui.editingPoApproverIndex === index) {
    resetPoApproverFields();
  } else if (ui.editingPoApproverIndex > index) {
    ui.editingPoApproverIndex -= 1;
  }

  renderPoApproverPreview();
}

function renderPoQuotationPreview() {
  const quoteBody = document.getElementById("po-quote-body");
  const quoteCount = document.getElementById("po-quote-count");
  const quoteHint = document.getElementById("po-quote-file-hint");
  const addQuoteButton = document.getElementById("po-add-quotation");

  if (!quoteBody || !quoteCount || !quoteHint || !addQuoteButton) {
    return;
  }

  quoteCount.textContent = `${ui.poDraftQuotations.length} penawaran`;
  addQuoteButton.textContent =
    ui.editingPoQuotationIndex >= 0 ? "Update Penawaran" : "Tambah Penawaran";

  if (ui.editingPoQuotationIndex >= 0 && ui.poDraftQuotations[ui.editingPoQuotationIndex]) {
    quoteHint.textContent = `File aktif: ${ui.poDraftQuotations[ui.editingPoQuotationIndex].fileName}`;
  } else {
    quoteHint.textContent = "Pilih file PDF untuk dilampirkan.";
  }

  if (!ui.poDraftQuotations.length) {
    quoteBody.innerHTML = `
      <div class="master-table-row po-quote-row pr-preview-empty">
        <span>1</span>
        <span>Belum ada penawaran vendor</span>
        <span>-</span>
        <span>-</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  quoteBody.innerHTML = ui.poDraftQuotations
    .map(
      (item, index) => `
        <div class="master-table-row po-quote-row">
          <span>${index + 1}</span>
          <span>${item.vendorName || "-"}</span>
          <span>${item.reference || "-"}</span>
          <span>${item.fileName || "-"}</span>
          <span class="icon-group">
            <button class="icon-button" title="Edit penawaran" data-action="edit-po-quotation" data-id="${index}" type="button">&#9998;</button>
            <button class="icon-button" title="Hapus penawaran" data-action="delete-po-quotation" data-id="${index}" type="button">&#128465;</button>
          </span>
        </div>
      `
    )
    .join("");
}

function resetPoQuotationFields() {
  const form = document.getElementById("po-form");
  if (!form) {
    return;
  }

  ui.editingPoQuotationIndex = -1;
  form.elements.namedItem("poQuoteVendor").value = "";
  form.elements.namedItem("poQuoteRef").value = "";
  form.elements.namedItem("poQuoteFile").value = "";
}

function addPoDraftQuotation(event) {
  if (event) {
    event.preventDefault();
  }

  const form = document.getElementById("po-form");
  if (!form) {
    return;
  }

  const vendorField = form.querySelector('[name="poQuoteVendor"]');
  const refField = form.querySelector('[name="poQuoteRef"]');
  const fileField = form.querySelector('[name="poQuoteFile"]');
  const selectedFile = fileField?.files?.[0];

  const vendorName = String(vendorField?.value || "").trim();
  const reference = String(refField?.value || "").trim();
  const existing = ui.poDraftQuotations[ui.editingPoQuotationIndex];
  const fileName = selectedFile?.name || existing?.fileName || "";

  if (!vendorName || !fileName) {
    return;
  }

  if (selectedFile && !String(selectedFile.name || "").toLowerCase().endsWith(".pdf")) {
    return;
  }

  const payload = {
    vendorName,
    reference,
    fileName
  };

  if (
    ui.editingPoQuotationIndex >= 0 &&
    ui.editingPoQuotationIndex < ui.poDraftQuotations.length
  ) {
    ui.poDraftQuotations[ui.editingPoQuotationIndex] = payload;
  } else {
    ui.poDraftQuotations.push(payload);
  }

  resetPoQuotationFields();
  renderPoQuotationPreview();
  vendorField?.focus();
}

function beginEditPoQuotation(index) {
  const quotation = ui.poDraftQuotations[index];
  const form = document.getElementById("po-form");

  if (!quotation || !form) {
    return;
  }

  ui.editingPoQuotationIndex = index;
  form.querySelector('[name="poQuoteVendor"]').value = quotation.vendorName || "";
  form.querySelector('[name="poQuoteRef"]').value = quotation.reference || "";
  form.querySelector('[name="poQuoteFile"]').value = "";
  renderPoQuotationPreview();
  form.querySelector('[name="poQuoteVendor"]').focus();
}

function deletePoDraftQuotation(index) {
  if (!ui.poDraftQuotations[index]) {
    return;
  }

  ui.poDraftQuotations.splice(index, 1);

  if (ui.editingPoQuotationIndex === index) {
    resetPoQuotationFields();
  } else if (ui.editingPoQuotationIndex > index) {
    ui.editingPoQuotationIndex -= 1;
  }

  renderPoQuotationPreview();
}

function renderPrList() {
  const container = document.getElementById("pr-list");
  const searchInput = document.getElementById("pr-search-input");
  const search = ui.prSearch.trim().toLowerCase();
  const prs = companyScoped(state.purchaseRequests)
    .filter((pr) => !search || pr.id.toLowerCase().includes(search))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (searchInput && searchInput.value !== ui.prSearch) {
    searchInput.value = ui.prSearch;
  }

  if (!companyScoped(state.purchaseRequests).length) {
    container.innerHTML = `<div class="empty-state">Belum ada PR di company aktif.</div>`;
    return;
  }

  if (!prs.length) {
    container.innerHTML = `<div class="empty-state">Tidak ada PR yang cocok dengan pencarian.</div>`;
    return;
  }

  const pageInfo = paginateItems(prs, ui.prPage);
  ui.prPage = pageInfo.currentPage;

  container.innerHTML = `
    <div class="pr-list-table">
      <div class="pr-list-table-head">
        <span>Nomor PR</span>
        <span>Tanggal</span>
        <span>Departemen</span>
        <span>Peminta</span>
        <span>Nilai</span>
        <span>Status</span>
        <span>Prioritas</span>
        <span>Kategori</span>
        <span>Judul / Keterangan</span>
        <span>Aksi</span>
      </div>
      ${pageInfo.items
        .map(
          (pr) => `
            <div class="pr-list-table-row">
              <span class="pr-list-cell pr-list-emphasis">${pr.id}</span>
              <span class="pr-list-cell">${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(pr.createdAt))}</span>
              <span class="pr-list-cell">${pr.department}</span>
              <span class="pr-list-cell">${pr.requester}</span>
              <span class="pr-list-cell pr-list-emphasis">${currency(pr.amount)}</span>
              <span class="pr-list-cell status-text ${pr.status === "approved" ? "ok" : pr.status === "rejected" ? "danger" : "muted"}">${prStatusBadge(pr.status)}</span>
              <span class="pr-list-cell">${getMasterValueName("priority", pr.priorityId)}</span>
              <span class="pr-list-cell">${pr.category === "non_asset" ? "Non-Asset" : pr.category === "mixed" ? "Campuran" : "Asset"}</span>
              <span class="pr-list-cell pr-list-title">${pr.title}</span>
              <span class="pr-list-cell">
                <span class="icon-group">
                  <button class="mini-button primary" data-action="view-pr-detail" data-id="${pr.id}" type="button">View</button>
                  ${
                    pr.status !== "approved"
                      ? `<button class="icon-button" title="Edit PR" data-action="edit-pr" data-id="${pr.id}" type="button">&#9998;</button>`
                      : ""
                  }
                </span>
              </span>
            </div>
          `
        )
        .join("")}
    </div>
    ${renderPagination("pr", pageInfo)}
  `;
}

function renderPrComposer() {
  const company = getCurrentCompany();
  const form = document.getElementById("pr-form");
  const existingPr = ui.editingPrId ? getPrById(ui.editingPrId) : null;
  const draftDate = new Date();
  const today = new Intl.DateTimeFormat("id-ID", { dateStyle: "short" }).format(draftDate);
  const nextPrNumber = buildDocumentNumber(
    state.session.activeCompanyId,
    "PR",
    draftDate,
    state.purchaseRequests
  );
  const submitButton = document.getElementById("pr-submit-button");

  document.getElementById("pr-company-display").value = company?.name || "-";
  document.getElementById("pr-number-display").value = existingPr?.id || nextPrNumber;
  document.getElementById("pr-date-display").value = existingPr
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short" }).format(new Date(existingPr.createdAt))
    : today;
  document.getElementById("pr-status-display").value = existingPr ? prStatusBadge(existingPr.status) : "Draft";

  if (submitButton) {
    submitButton.textContent = existingPr ? "Update Purchase Request" : "Submit Purchase Request";
  }

  if (!form) {
    return;
  }

  if (!existingPr) {
    return;
  }

  form.department.value = existingPr.department || "";
  form.requester.value = existingPr.requester || "";
  form.priority.value = existingPr.priorityId || "";
  form.requestType.value = existingPr.requestTypeId || "";
  form.useLocation.value = existingPr.costCenter || "";
  form.needByDate.value = existingPr.needByDate || "";
  form.requestNote.value = existingPr.requestNote || "";

  ui.prDraftItems = getEditablePrItems(existingPr);
  ui.prDraftApprovers = getEditablePrApprovers(existingPr);
}

function beginEditPr(id) {
  const pr = getPrById(id);
  if (!pr || pr.companyId !== state.session.activeCompanyId || pr.status === "approved") {
    return;
  }

  ui.editingPrId = id;
  ui.selectedPrDetailId = "";
  ui.prFormOpen = true;
  document.getElementById("pr-form").reset();
  renderMasterReferenceOptions();
  renderPrComposer();
  renderPrDraftPreview();
  renderPrForm();
  document.getElementById("pr-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPrDetailPanel() {
  const panel = document.getElementById("pr-detail-panel");
  const pr = getPrById(ui.selectedPrDetailId);

  if (!pr || pr.companyId !== state.session.activeCompanyId || ui.prFormOpen) {
    panel.classList.add("app-hidden");
    panel.innerHTML = "";
    return;
  }

  const items = getEditablePrItems(pr);

  panel.classList.remove("app-hidden");
  panel.innerHTML = `
    <div class="panel-header">
      <div>
        <h3>Detail Purchase Request</h3>
        <p>${pr.id} - ${pr.title}</p>
      </div>
      <button class="button secondary" data-action="close-pr-detail" type="button">Tutup Detail</button>
    </div>
    <div class="pr-detail-grid">
      <div class="pr-detail-field">
        <span class="pr-detail-label">Tanggal</span>
        <strong>${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(pr.createdAt))}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Departemen</span>
        <strong>${pr.department}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Peminta</span>
        <strong>${pr.requester}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Status</span>
        <strong class="status-text ${pr.status === "approved" ? "ok" : pr.status === "rejected" ? "danger" : "muted"}">${prStatusBadge(pr.status)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Prioritas</span>
        <strong>${getMasterValueName("priority", pr.priorityId)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Nilai</span>
        <strong>${currency(pr.amount)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Kategori</span>
        <strong>${pr.category === "non_asset" ? "Non-Asset" : pr.category === "mixed" ? "Campuran" : "Asset"}</strong>
      </div>
      <div class="pr-detail-field pr-detail-field-wide">
        <span class="pr-detail-label">Deskripsi</span>
        <strong>${pr.description || "-"}</strong>
      </div>
    </div>
    <div class="master-table pr-preview-table">
      <div class="master-table-head pr-preview-head">
        <span>Kode</span>
        <span>Nama</span>
        <span>Qty</span>
        <span>Harga</span>
        <span>Kategori</span>
        <span>Gudang</span>
      </div>
      ${items
        .map(
          (item, index) => `
            <div class="master-table-row pr-preview-row">
              <span>PRV-${String(index + 1).padStart(3, "0")}</span>
              <span>${item.name}</span>
              <span>${item.qty}</span>
              <span>${currency(item.price)}</span>
              <span>${item.category === "non_asset" ? "Non-Asset" : "Asset"}</span>
              <span>User Request</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderApprovalList() {
  const prContainer = document.getElementById("approval-pr-list");
  const poContainer = document.getElementById("approval-po-list");
  const prCount = document.getElementById("approval-pr-count");
  const poCount = document.getElementById("approval-po-count");

  if (!prContainer || !poContainer || !prCount || !poCount) {
    return;
  }

  const prSearchInput = document.getElementById("approval-pr-search-input");
  const poSearchInput = document.getElementById("approval-po-search-input");
  const prSearch = ui.approvalPrSearch.trim().toLowerCase();
  const poSearch = ui.approvalPoSearch.trim().toLowerCase();

  if (prSearchInput && prSearchInput.value !== ui.approvalPrSearch) {
    prSearchInput.value = ui.approvalPrSearch;
  }

  if (poSearchInput && poSearchInput.value !== ui.approvalPoSearch) {
    poSearchInput.value = ui.approvalPoSearch;
  }

  const pendingPrDocs = companyScoped(state.purchaseRequests)
    .filter((item) => ["submitted", "waiting_finance"].includes(item.status))
    .filter((item) => !prSearch || item.id.toLowerCase().includes(prSearch))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pendingPoDocs = companyScoped(state.purchaseOrders)
    .filter((item) => item.status === "waiting_approval")
    .filter((item) => !poSearch || item.id.toLowerCase().includes(poSearch))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pendingPr = pendingPrDocs.flatMap((pr) =>
    (Array.isArray(pr.approvalSetup) && pr.approvalSetup.length ? pr.approvalSetup : [{ name: "-", title: "-", email: "-" }]).map(
      (entry, index) => ({ pr, entry, index })
    )
  );
  const pendingPo = pendingPoDocs.flatMap((po) =>
    (Array.isArray(po.approvalSetup) && po.approvalSetup.length ? po.approvalSetup : [{ name: "-", title: "-", email: "-" }]).map(
      (entry, index) => ({ po, entry, index })
    )
  );
  const prPageInfo = paginateItems(pendingPr, ui.approvalPrPage);
  const poPageInfo = paginateItems(pendingPo, ui.approvalPoPage);

  ui.approvalPrPage = prPageInfo.currentPage;
  ui.approvalPoPage = poPageInfo.currentPage;

  prCount.textContent = `${pendingPrDocs.length} dokumen`;
  poCount.textContent = `${pendingPoDocs.length} dokumen`;

  prContainer.innerHTML = pendingPr.length
    ? `
      <div class="approval-table">
        <div class="approval-table-head">
          <span>No</span>
          <span>Nomor PR</span>
          <span>Tanggal</span>
          <span>Peminta</span>
          <span>Nilai</span>
          <span>Status Dokumen</span>
          <span>Nama Approver</span>
          <span>Jabatan</span>
          <span>Email</span>
          <span>Status PIC</span>
          <span>Aksi</span>
        </div>
        ${prPageInfo.items
          .map(
            ({ pr, entry, index }, rowIndex) => `
                <div class="approval-table-row">
                  <span>${(prPageInfo.currentPage - 1) * PAGE_SIZE + rowIndex + 1}</span>
                  <span>${pr.id}</span>
                  <span>${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(pr.createdAt))}</span>
                  <span>${pr.requester}</span>
                  <span>${currency(pr.amount)}</span>
                  <span class="status-text ${pr.status === "approved" ? "ok" : pr.status === "rejected" ? "danger" : "muted"}">${prStatusBadge(pr.status)}</span>
                  <span>${entry.name || "-"}</span>
                  <span>${entry.title || "-"}</span>
                  <span>${entry.email || "-"}</span>
                  <span>${getApprovalRowStageLabel("pr", pr, index)}</span>
                  <span class="icon-group">
                    <button class="icon-button" title="Approve" data-action="approve-pr" data-id="${pr.id}" type="button">&#10003;</button>
                    <button class="icon-button" title="Reject" data-action="reject-pr" data-id="${pr.id}" type="button">&#10005;</button>
                    <button class="icon-button" title="Send ulang email" data-action="resend-approval-email" data-type="pr" data-id="${pr.id}" data-index="${index}" type="button">&#9993;</button>
                  </span>
                </div>
              `
          )
          .join("")}
      </div>
      ${renderPagination("approval-pr", prPageInfo)}
    `
    : `<div class="empty-state">Tidak ada Purchase Request yang menunggu approval.</div>`;

  poContainer.innerHTML = pendingPo.length
    ? `
      <div class="approval-table">
        <div class="approval-table-head approval-table-head-po">
          <span>No</span>
          <span>Nomor PO</span>
          <span>Nomor PR</span>
          <span>Vendor</span>
          <span>Nilai</span>
          <span>Status Dokumen</span>
          <span>Nama Approver</span>
          <span>Jabatan</span>
          <span>Email</span>
          <span>Status PIC</span>
          <span>Aksi</span>
        </div>
        ${poPageInfo.items
          .map(
            ({ po, entry, index }, rowIndex) => `
                <div class="approval-table-row approval-table-row-po">
                  <span>${(poPageInfo.currentPage - 1) * PAGE_SIZE + rowIndex + 1}</span>
                  <span>${po.id}</span>
                  <span>${po.prId}</span>
                  <span>${po.vendorName || "-"}</span>
                  <span>${currency(po.amount)}</span>
                  <span class="status-text ${po.status === "issued" ? "ok" : po.status === "rejected" ? "danger" : "muted"}">${po.status === "waiting_approval" ? "Menunggu Approval" : po.status}</span>
                  <span>${entry.name || "-"}</span>
                  <span>${entry.title || "-"}</span>
                  <span>${entry.email || "-"}</span>
                  <span>${getApprovalRowStageLabel("po", po, index)}</span>
                  <span class="icon-group">
                    <button class="icon-button" title="Approve" data-action="approve-po" data-id="${po.id}" type="button">&#10003;</button>
                    <button class="icon-button" title="Reject" data-action="reject-po" data-id="${po.id}" type="button">&#10005;</button>
                    <button class="icon-button" title="Send ulang email" data-action="resend-approval-email" data-type="po" data-id="${po.id}" data-index="${index}" type="button">&#9993;</button>
                  </span>
                </div>
              `
          )
          .join("")}
      </div>
      ${renderPagination("approval-po", poPageInfo)}
    `
    : `<div class="empty-state">Tidak ada Purchase Order yang menunggu approval.</div>`;
}

function renderApprovedPrOptions() {
  const select = document.getElementById("approved-pr-select");
  if (!select) {
    return;
  }

  const currentValue = ui.selectedPoCreatePrId || select.value;
  const alreadyUsed = new Set(companyScoped(state.purchaseOrders).map((item) => item.prId));
  const approved = companyScoped(state.purchaseRequests).filter(
    (item) => item.status === "approved" && !alreadyUsed.has(item.id)
  );

  select.innerHTML = approved.length
    ? approved.map((pr) => `<option value="${pr.id}">${pr.id}</option>`).join("")
      : `<option value="">Belum ada PR approved yang belum dibuatkan PO</option>`;

  if (currentValue && approved.some((pr) => pr.id === currentValue)) {
    select.value = currentValue;
  }
}

function loadPoDraftItemsFromSelectedPr() {
  const select = document.getElementById("approved-pr-select");
  const pr = getPrById(select?.value);
  ui.poDraftItems = pr
    ? getEditablePrItems(pr).map((item) => ({
        ...item,
        vatPercent: 0
      }))
    : [];
}

function updatePoDraftItemVat(index, rawValue, shouldRender = true) {
  const item = ui.poDraftItems[index];
  if (!item) {
    return;
  }

  const vatPercent = Math.max(0, Number(rawValue || 0));
  item.vatPercent = Number.isFinite(vatPercent) ? vatPercent : 0;
  if (shouldRender) {
    renderPoSourceItemsPreview();
  }
}

function renderPoSourceItemsPreview() {
  const body = document.getElementById("po-source-preview-body");
  const count = document.getElementById("po-source-item-count");
  const netTotal = document.getElementById("po-source-item-net-total");
  const vatTotal = document.getElementById("po-source-item-vat-total");
  const grandTotal = document.getElementById("po-source-item-grand-total");
  const select = document.getElementById("approved-pr-select");

  if (!body || !count || !netTotal || !vatTotal || !grandTotal || !select) {
    return;
  }

  const items = ui.poDraftItems;

  count.textContent = `${items.length} item`;
  netTotal.textContent = `Net ${currency(items.reduce((sum, item) => sum + getItemNetAmount(item), 0))}`;
  vatTotal.textContent = `VAT ${currency(items.reduce((sum, item) => sum + getItemVatAmount(item), 0))}`;
  grandTotal.textContent = `Total ${currency(items.reduce((sum, item) => sum + getItemGrandTotal(item), 0))}`;

  if (!items.length) {
    body.innerHTML = `
      <div class="master-table-row pr-preview-row po-source-preview-row pr-preview-empty">
        <span>PRV-001</span>
        <span>Belum ada item dari Purchase Request</span>
        <span>0</span>
        <span>Rp 0</span>
        <span>0%</span>
        <span>Rp 0</span>
        <span>Rp 0</span>
        <span>Rp 0</span>
        <span>-</span>
        <span>User Request</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  body.innerHTML = items
    .map(
      (item, index) => `
        <div class="master-table-row pr-preview-row po-source-preview-row">
          <span>PRV-${String(index + 1).padStart(3, "0")}</span>
          <span>${item.name || "-"}</span>
          <span>${item.qty || 0}</span>
          <span>${currency(Number(item.price || 0))}</span>
          <span>
            <input
              class="table-input"
              data-action="update-po-item-vat"
              data-id="${index}"
              type="number"
              min="0"
              step="0.01"
              value="${getItemVatPercent(item)}"
            />
          </span>
          <span>${currency(getItemNetAmount(item))}</span>
          <span>${currency(getItemVatAmount(item))}</span>
          <span>${currency(getItemGrandTotal(item))}</span>
          <span>${item.category === "non_asset" ? "Non-Asset" : "Asset"}</span>
          <span>User Request</span>
          <span>-</span>
        </div>
      `
    )
    .join("");
}

function getPoSourceSubtotal() {
  return ui.poDraftItems.reduce((sum, item) => sum + getItemNetAmount(item), 0);
}

function getPoDraftVatPercent() {
  return getSharedItemVatPercent(ui.poDraftItems);
}

function getPoDraftVatAmount() {
  return ui.poDraftItems.reduce((sum, item) => sum + getItemVatAmount(item), 0);
}

function getPoDraftGrandTotal() {
  return getPoSourceSubtotal() + getPoDraftVatAmount();
}

function syncPoFinancialPreview() {
  renderPoSourceItemsPreview();
}

function renderPoForm() {
  const panel = document.getElementById("po-form-panel");
  const list = document.getElementById("po-list");
  const detail = document.getElementById("po-detail-panel");

  panel.classList.toggle("app-hidden", !ui.poFormOpen);
  list.classList.toggle("app-hidden", ui.poFormOpen);
  detail.classList.toggle("app-hidden", ui.poFormOpen || !ui.selectedPoDetailPrId);
  renderPoApproverPreview();
  renderPoQuotationPreview();
  syncPoFinancialPreview();
}

function renderPoList() {
  const container = document.getElementById("po-list");
  const searchInput = document.getElementById("po-search-input");
  const search = ui.poSearch.trim().toLowerCase();
  const allPrs = companyScoped(state.purchaseRequests);
  const prs = allPrs
    .filter((pr) => {
      const po = getLatestPoByPrId(pr.id);
      const target = `${pr.id} ${po?.id || ""}`.toLowerCase();
      return !search || target.includes(search);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (searchInput && searchInput.value !== ui.poSearch) {
    searchInput.value = ui.poSearch;
  }

  if (!allPrs.length) {
    container.innerHTML = `<div class="empty-state">Belum ada Purchase Request di company aktif.</div>`;
    return;
  }

  if (!prs.length) {
    container.innerHTML = `<div class="empty-state">Tidak ada PR atau PO yang cocok dengan pencarian.</div>`;
    return;
  }

  const pageInfo = paginateItems(prs, ui.poPage);
  ui.poPage = pageInfo.currentPage;

  container.innerHTML = `
    <div class="po-list-table">
      <div class="po-list-table-head">
        <span>Nomor PR</span>
        <span>Tanggal</span>
        <span>Departemen</span>
        <span>Peminta</span>
        <span>Nilai</span>
        <span>PPN</span>
        <span>Total</span>
        <span>Status</span>
        <span>Prioritas</span>
        <span>Kategori</span>
        <span>Judul / Keterangan</span>
        <span>Aksi</span>
      </div>
      ${pageInfo.items
        .map((pr) => {
          const po = getLatestPoByPrId(pr.id);
          const canCreatePo = pr.status === "approved" && !po;
          const statusLabel = po ? poStatusBadge(po) : prStatusBadge(pr.status);
          const financialSource = po || { amount: pr.amount, vatAmount: 0, totalAmount: pr.amount };
          return `
            <div class="po-list-table-row">
              <span class="po-list-cell po-list-emphasis">${pr.id}</span>
              <span class="po-list-cell">${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(pr.createdAt))}</span>
              <span class="po-list-cell">${pr.department}</span>
              <span class="po-list-cell">${pr.requester}</span>
              <span class="po-list-cell po-list-emphasis">${currency(financialSource.amount)}</span>
              <span class="po-list-cell">${currency(financialSource.vatAmount || 0)}</span>
              <span class="po-list-cell po-list-emphasis">${currency(financialSource.totalAmount || financialSource.amount)}</span>
              <span class="po-list-cell status-text ${po ? poStatusClass(po) : pr.status === "approved" ? "ok" : pr.status === "rejected" ? "danger" : "muted"}">${statusLabel}</span>
              <span class="po-list-cell">${getMasterValueName("priority", pr.priorityId)}</span>
              <span class="po-list-cell">${pr.category === "non_asset" ? "Non-Asset" : pr.category === "mixed" ? "Campuran" : "Asset"}</span>
              <span class="po-list-cell po-list-title">${pr.title}</span>
              <span class="po-list-cell">
                <span class="icon-group">
                  <button class="mini-button primary" data-action="view-po-source" data-id="${pr.id}" type="button">View</button>
                  ${
                    canCreatePo
                      ? `<button class="icon-button" title="Create PO" data-action="create-po-from-pr" data-id="${pr.id}" type="button">&#10133;</button>`
                      : ""
                  }
                </span>
              </span>
            </div>
          `;
        })
        .join("")}
    </div>
    ${renderPagination("po", pageInfo)}
  `;
}

function renderPoDetailPanel() {
  const panel = document.getElementById("po-detail-panel");
  const pr = getPrById(ui.selectedPoDetailPrId);

  if (!pr || pr.companyId !== state.session.activeCompanyId || ui.poFormOpen) {
    panel.classList.add("app-hidden");
    panel.innerHTML = "";
    return;
  }

  const linkedPo = getLatestPoByPrId(pr.id);
  const items = Array.isArray(linkedPo?.items) && linkedPo.items.length
    ? linkedPo.items
    : getEditablePrItems(pr).map((item) => ({
        ...item,
        vatPercent: linkedPo ? Number(linkedPo.vatPercent || 0) : 0
      }));
  const financialSource = linkedPo || { amount: pr.amount, vatAmount: 0, totalAmount: pr.amount };

  panel.classList.remove("app-hidden");
  panel.innerHTML = `
    <div class="panel-header">
      <div>
        <h3>Detail Sumber Purchase Order</h3>
        <p>${pr.id} - ${pr.title}</p>
      </div>
      <button class="button secondary" data-action="close-po-detail" type="button">Tutup Detail</button>
    </div>
    <div class="pr-detail-grid">
      <div class="pr-detail-field">
        <span class="pr-detail-label">Status</span>
        <strong class="status-text ${linkedPo ? poStatusClass(linkedPo) : pr.status === "approved" ? "ok" : pr.status === "rejected" ? "danger" : "muted"}">${linkedPo ? poStatusBadge(linkedPo) : prStatusBadge(pr.status)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Departemen</span>
        <strong>${pr.department}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Peminta</span>
        <strong>${pr.requester}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Prioritas</span>
        <strong>${getMasterValueName("priority", pr.priorityId)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Kategori</span>
        <strong>${pr.category === "non_asset" ? "Non-Asset" : pr.category === "mixed" ? "Campuran" : "Asset"}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Nilai</span>
        <strong>${currency(financialSource.amount)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">PPN</span>
        <strong>${currency(financialSource.vatAmount || 0)}</strong>
      </div>
      <div class="pr-detail-field">
        <span class="pr-detail-label">Total</span>
        <strong>${currency(financialSource.totalAmount || financialSource.amount)}</strong>
      </div>
      <div class="pr-detail-field pr-detail-field-wide">
        <span class="pr-detail-label">Deskripsi</span>
        <strong>${pr.description || "-"}</strong>
      </div>
    </div>
    <div class="master-table pr-preview-table">
      <div class="master-table-head pr-preview-head po-source-preview-head">
        <span>Kode</span>
        <span>Nama</span>
        <span>Qty</span>
        <span>Harga</span>
        <span>PPN</span>
        <span>Net</span>
        <span>VAT</span>
        <span>Total</span>
        <span>Kategori</span>
        <span>Gudang</span>
        <span>Aksi</span>
      </div>
      ${items
        .map(
          (item, index) => `
            <div class="master-table-row pr-preview-row po-source-preview-row">
              <span>PRV-${String(index + 1).padStart(3, "0")}</span>
              <span>${item.name}</span>
              <span>${item.qty}</span>
              <span>${currency(item.price)}</span>
              <span>${getItemVatPercent(item)}%</span>
              <span>${currency(getItemNetAmount(item))}</span>
              <span>${currency(getItemVatAmount(item))}</span>
              <span>${currency(getItemGrandTotal(item))}</span>
              <span>${item.category === "non_asset" ? "Non-Asset" : "Asset"}</span>
              <span>User Request</span>
              <span>-</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function getPoLineItems(po) {
  if (!po) {
    return [];
  }

  if (Array.isArray(po.items) && po.items.length) {
    return po.items;
  }

  const pr = getPrById(po.prId);
  return pr ? getEditablePrItems(pr) : [];
}

function getReceiveLineType(item) {
  return item.category === "non_asset" ? "Jasa / Non-Asset" : "Barang / Asset";
}

function getPoReceiveKind(po) {
  const items = getPoLineItems(po);
  const categories = [...new Set(items.map((item) => (item.category === "non_asset" ? "service" : "goods")))];

  if (!categories.length) {
    return "goods";
  }

  return categories.length === 1 ? categories[0] : "mixed";
}

function getReceiveBasisOptions(po) {
  const kind = getPoReceiveKind(po);
  if (kind === "goods") {
    return ["quantity"];
  }

  if (kind === "service") {
    return ["deliverable", "amount"];
  }

  return ["quantity", "deliverable", "amount"];
}

function normalizeReceiveBasisForPo(po, requestedBasis = ui.receiveBasis) {
  const options = getReceiveBasisOptions(po);
  return options.includes(requestedBasis) ? requestedBasis : options[0];
}

function getPoLineTotalAmount(item) {
  const netAmount = Number(item.qty || 0) * Number(item.price || 0);
  const vatAmount = netAmount * (Number(getItemVatPercent(item) || 0) / 100);
  return netAmount + vatAmount;
}

function getReceivedQty(poId, itemIndex) {
  return companyScoped(state.receipts).reduce((total, receipt) => {
    if (receipt.poId !== poId) {
      return total;
    }

    if (!Array.isArray(receipt.items)) {
      const legacyPo = getPoById(poId);
      const legacyItem = getPoLineItems(legacyPo)[itemIndex];
      return total + Number(legacyItem?.qty || 0);
    }

    const line = receipt.items.find((item) => Number(item.itemIndex) === itemIndex);
    return total + Number(line?.qtyReceived || 0);
  }, 0);
}

function getReceivedAmount(poId, itemIndex) {
  return companyScoped(state.receipts).reduce((total, receipt) => {
    if (receipt.poId !== poId || !Array.isArray(receipt.items)) {
      return total;
    }

    const line = receipt.items.find((item) => Number(item.itemIndex) === itemIndex);
    if (!line) {
      return total;
    }

    if (line.amountReceived !== undefined) {
      return total + Number(line.amountReceived || 0);
    }

    const legacyAmount = Number(line.price || 0) * Number(line.qtyReceived || 0) * (1 + Number(line.vatPercent || 0) / 100);
    return total + legacyAmount;
  }, 0);
}

function hasFinalDeliverable(poId, itemIndex) {
  return companyScoped(state.receipts).some((receipt) =>
    receipt.poId === poId &&
    Array.isArray(receipt.items) &&
    receipt.items.some((item) => Number(item.itemIndex) === itemIndex && item.isFinalDeliverable)
  );
}

function getPoRemainingQty(po, itemIndex) {
  const item = getPoLineItems(po)[itemIndex];
  return Math.max(0, Number(item?.qty || 0) - getReceivedQty(po.id, itemIndex));
}

function getPoRemainingAmount(po, itemIndex) {
  const item = getPoLineItems(po)[itemIndex];
  return Math.max(0, getPoLineTotalAmount(item || {}) - getReceivedAmount(po.id, itemIndex));
}

function isPoLineFullyReceived(po, itemIndex) {
  const item = getPoLineItems(po)[itemIndex];
  if (!item) {
    return true;
  }

  return (
    getPoRemainingQty(po, itemIndex) <= 0 ||
    getPoRemainingAmount(po, itemIndex) <= 0 ||
    hasFinalDeliverable(po.id, itemIndex)
  );
}

function poHasRemainingReceiveProgress(po) {
  return getPoLineItems(po).some((_, index) => !isPoLineFullyReceived(po, index));
}

function getReceivablePurchaseOrders() {
  return companyScoped(state.purchaseOrders).filter((item) =>
    ["issued", "partial_received"].includes(item.status) && poHasRemainingReceiveProgress(item)
  );
}

function renderReceivePoList() {
  const container = document.getElementById("receive-po-list");
  const pos = getReceivablePurchaseOrders()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!container) {
    return;
  }

  if (!pos.length) {
    container.innerHTML = `<div class="empty-state">Belum ada PO issued atau partial yang siap receive.</div>`;
    return;
  }

  const pageInfo = paginateItems(pos, ui.receivePage);
  ui.receivePage = pageInfo.currentPage;

  container.innerHTML = `
    <div class="receive-po-table">
      <div class="receive-po-head">
        <span>Nomor PO</span>
        <span>Nama PT</span>
        <span>Vendor</span>
        <span>Tanggal PO</span>
        <span>Ref PR</span>
        <span>Nilai</span>
        <span>Status</span>
        <span>Tipe Receive</span>
        <span>Sisa Item</span>
        <span>Aksi</span>
      </div>
      ${pageInfo.items
        .map((po) => {
          const company = getCompanyById(po.companyId);
          const remainingLines = getPoLineItems(po).filter((_, index) => !isPoLineFullyReceived(po, index)).length;
          return `
            <div class="receive-po-row">
              <span class="po-list-emphasis">${po.id}</span>
              <span>${company?.name || "-"}</span>
              <span>${po.vendorName || "-"}</span>
              <span>${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(po.createdAt))}</span>
              <span>${po.prId}</span>
              <span class="po-list-emphasis">${currency(po.totalAmount || po.amount || 0)}</span>
              <span class="status-text ${poStatusClass(po)}">${poStatusBadge(po).replace(` (${po.id})`, "")}</span>
              <span>${RECEIVE_KIND_LABELS[getPoReceiveKind(po)]}</span>
              <span>${remainingLines} line</span>
              <span>
                <button class="button action-button receive-row-button" data-action="open-receive-po" data-id="${po.id}" type="button">Receive</button>
              </span>
            </div>
          `;
        })
        .join("")}
    </div>
    ${renderPagination("receive", pageInfo)}
  `;
}

function renderReceiveForm() {
  const panel = document.getElementById("receive-form-panel");
  const poIdField = document.getElementById("receive-po-id");
  const detail = document.getElementById("receive-po-detail");
  const basisField = document.getElementById("receive-basis");
  const selectedPo = getPoById(ui.selectedReceivePoId);
  const po = selectedPo?.companyId === state.session.activeCompanyId ? selectedPo : null;
  const pr = po ? getPrById(po.prId) : null;
  const company = po ? getCompanyById(po.companyId) : null;

  if (!panel || !poIdField || !detail) {
    return;
  }

  panel.classList.toggle("app-hidden", !ui.receiveFormOpen || !po);
  poIdField.value = po?.id || "";
  if (basisField && basisField.value !== ui.receiveBasis) {
    basisField.value = ui.receiveBasis;
  }

  if (!po) {
    detail.innerHTML = "";
    renderReceiveLines();
    return;
  }

  const receiveKind = getPoReceiveKind(po);
  const receiveBasisOptions = getReceiveBasisOptions(po);
  ui.receiveBasis = normalizeReceiveBasisForPo(po, ui.receiveBasis);
  if (basisField) {
    basisField.innerHTML = receiveBasisOptions
      .map((basis) => `<option value="${basis}">Berdasarkan ${RECEIVE_BASIS_LABELS[basis]}</option>`)
      .join("");
    basisField.value = ui.receiveBasis;
  }

  detail.innerHTML = `
    <div class="pr-detail-field">
      <span class="pr-detail-label">Nomor PO</span>
      <strong>${po.id}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Nama PT</span>
      <strong>${company?.name || "-"}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Vendor</span>
      <strong>${po.vendorName || "-"}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Tanggal PO</span>
      <strong>${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(po.createdAt))}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Ref PR</span>
      <strong>${po.prId}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Requester</span>
      <strong>${pr?.requester || "-"}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Total PO</span>
      <strong>${currency(po.totalAmount || po.amount || 0)}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Status</span>
      <strong class="status-text ${poStatusClass(po)}">${poStatusBadge(po).replace(` (${po.id})`, "")}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Tipe Penerimaan</span>
      <strong>${RECEIVE_KIND_LABELS[receiveKind]}</strong>
    </div>
    <div class="pr-detail-field">
      <span class="pr-detail-label">Basis Tersedia</span>
      <strong>${receiveBasisOptions.map((basis) => RECEIVE_BASIS_LABELS[basis]).join(" / ")}</strong>
    </div>
  `;
  renderReceiveLines();
}

function renderIssuedPoOptions() {
  renderReceivePoList();
  renderReceiveForm();
}

function renderReceiveLines() {
  const head = document.getElementById("receive-line-head");
  const body = document.getElementById("receive-line-body");
  const summary = document.getElementById("receive-line-summary");
  const selectedPo = getPoById(ui.selectedReceivePoId);
  const po = selectedPo?.companyId === state.session.activeCompanyId ? selectedPo : null;
  const basis = ui.receiveBasis || "quantity";

  if (!head || !body || !summary) {
    return;
  }

  const items = getPoLineItems(po);
  const normalizedBasis = po ? normalizeReceiveBasisForPo(po, basis) : basis;
  const receiveKind = po ? getPoReceiveKind(po) : "goods";
  summary.textContent = `${items.length} item - ${RECEIVE_KIND_LABELS[receiveKind]} - ${RECEIVE_BASIS_LABELS[normalizedBasis] || "Quantity"}`;

  if (normalizedBasis === "amount") {
    head.innerHTML = `
      <span>Kode</span>
      <span>Nama Barang / Jasa</span>
      <span>Tipe</span>
      <span>Total PO</span>
      <span>Sudah Receive</span>
      <span>Sisa Nominal</span>
      <span>Nominal Receive</span>
    `;
  } else if (normalizedBasis === "deliverable") {
    head.innerHTML = `
      <span>Kode</span>
      <span>Nama Barang / Jasa</span>
      <span>Tipe</span>
      <span>Sisa Nominal</span>
      <span>Nominal Deliverable</span>
      <span>Dokumen Deliverable</span>
      <span>Final</span>
    `;
  } else {
    head.innerHTML = `
      <span>Kode</span>
      <span>Nama Barang / Jasa</span>
      <span>Tipe</span>
      <span>Qty PO</span>
      <span>Sudah Receive</span>
      <span>Sisa</span>
      <span>Qty Receive</span>
    `;
  }

  if (!po || !items.length) {
    body.innerHTML = `
      <div class="master-table-row receive-line-row">
        <span>-</span>
        <span>Belum ada PO atau item yang siap diterima</span>
        <span>-</span>
        <span>0</span>
        <span>0</span>
        <span>0</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  body.innerHTML = items
    .map((item, index) => {
      const orderedQty = Number(item.qty || 0);
      const receivedQty = getReceivedQty(po.id, index);
      const remainingQty = Math.max(0, orderedQty - receivedQty);
      const lineAmount = getPoLineTotalAmount(item);
      const receivedAmount = getReceivedAmount(po.id, index);
      const remainingAmount = Math.max(0, lineAmount - receivedAmount);
      const completed = isPoLineFullyReceived(po, index);
      const disabled = completed ? "disabled" : "";

      if (normalizedBasis === "amount") {
        return `
          <div class="master-table-row receive-line-row">
            <span>POL-${String(index + 1).padStart(3, "0")}</span>
            <span>${item.name || "-"}</span>
            <span>${getReceiveLineType(item)}</span>
            <span>${currency(lineAmount)}</span>
            <span>${currency(receivedAmount)}</span>
            <span>${currency(remainingAmount)}</span>
            <span>
              <input
                class="table-input receive-money-input"
                name="receiveAmount-${index}"
                type="number"
                min="0"
                max="${remainingAmount}"
                step="1000"
                value="${remainingAmount > 0 ? remainingAmount : 0}"
                ${disabled}
              />
            </span>
          </div>
        `;
      }

      if (normalizedBasis === "deliverable") {
        return `
          <div class="master-table-row receive-line-row">
            <span>POL-${String(index + 1).padStart(3, "0")}</span>
            <span>${item.name || "-"}</span>
            <span>${getReceiveLineType(item)}</span>
            <span>${currency(remainingAmount)}</span>
            <span>
              <input
                class="table-input receive-money-input"
                name="receiveAmount-${index}"
                type="number"
                min="0"
                max="${remainingAmount}"
                step="1000"
                value="${remainingAmount > 0 ? remainingAmount : 0}"
                ${disabled}
              />
            </span>
            <span>
              <input
                class="table-input"
                name="deliverableName-${index}"
                placeholder="BAST milestone / laporan"
                ${disabled}
              />
            </span>
            <span class="receive-final-cell">
              <input name="deliverableFinal-${index}" type="checkbox" ${disabled} />
              <small>Final</small>
            </span>
          </div>
        `;
      }

      return `
        <div class="master-table-row receive-line-row">
          <span>POL-${String(index + 1).padStart(3, "0")}</span>
          <span>${item.name || "-"}</span>
          <span>${getReceiveLineType(item)}</span>
          <span>${orderedQty}</span>
          <span>${receivedQty}</span>
          <span>${remainingQty}</span>
          <span>
            <input
              class="table-input"
              name="receiveQty-${index}"
              type="number"
              min="0"
              max="${remainingQty}"
              step="1"
              value="${remainingQty > 0 ? remainingQty : 0}"
              ${remainingQty <= 0 ? "disabled" : ""}
            />
          </span>
        </div>
      `;
    })
    .join("");
}

function renderReceiveList() {
  const container = document.getElementById("receive-list");
  if (!container) {
    return;
  }

  const receipts = companyScoped(state.receipts);

  if (!receipts.length) {
    container.innerHTML = `<div class="empty-state">Belum ada transaksi receive.</div>`;
    return;
  }

  container.innerHTML = receipts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (receipt) => `
        <article class="stack-item">
          <header>
            <div>
              <h4>${receipt.id} - ${receipt.poId}</h4>
              <p>${receipt.receiver} - ${formatDate(receipt.createdAt)}</p>
            </div>
            <span class="pill soft">${
              receipt.receiveType === "mixed"
                ? "Barang & Jasa"
                : receipt.receiveType === "asset"
                  ? "Barang / Asset"
                  : "Jasa / Non-Asset"
            }</span>
          </header>
          <p>${receipt.note}</p>
          <div class="inline-tags">
            <span class="tag">Basis: ${RECEIVE_BASIS_LABELS[receipt.receiveBasis || "quantity"]}</span>
          </div>
          ${
            Array.isArray(receipt.items) && receipt.items.length
              ? `
                <div class="receive-history-lines">
                  ${receipt.items
                    .map(
                      (item) => `
                        <span>${item.name} - ${item.type} - ${
                          receipt.receiveBasis === "deliverable"
                            ? `${item.deliverableName || "Deliverable"}${item.isFinalDeliverable ? " (Final)" : ""} - ${currency(item.amountReceived || 0)}`
                            : receipt.receiveBasis === "amount"
                              ? `Nominal ${currency(item.amountReceived || 0)}`
                              : `Qty ${item.qtyReceived} - ${currency(item.amountReceived || 0)}`
                        }</span>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
          <div class="inline-tags">
            <span class="tag">${currency(receipt.amount)}</span>
            <span class="tag">${receipt.documentType || "Dokumen"}: ${receipt.documentRef}</span>
            ${receipt.documentFileName ? `<span class="tag">${receipt.documentFileName}</span>` : ""}
            ${
              receipt.assetNumber
                ? `<span class="tag">Register ${receipt.assetNumber}</span>`
                : `<span class="tag">Posted ke expense/inventory</span>`
            }
          </div>
        </article>
      `
    )
    .join("");
}

function renderCoaList() {
  document.getElementById("coa-list").innerHTML = coaMaster
    .map(
      (coa) => `
        <article class="coa-item">
          <div>
            <h4>${coa.code} - ${coa.name}</h4>
            <p>${coa.kind === "asset" ? "Asset account" : coa.kind === "liability" ? "Liability / clearing" : "Expense / inventory"}</p>
          </div>
          <span class="pill ${coa.kind === "liability" ? "" : "soft"}">${coa.kind}</span>
        </article>
      `
    )
    .join("");
}

function renderJournalList() {
  const container = document.getElementById("journal-list");
  const journals = companyScoped(state.journals);

  if (!journals.length) {
    container.innerHTML = `<div class="empty-state">Belum ada jurnal otomatis.</div>`;
    return;
  }

  container.innerHTML = journals
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (journal) => `
        <article class="stack-item">
          <header>
            <div>
              <h4>${journal.id} - Source ${journal.sourceId}</h4>
              <p>${formatDate(journal.createdAt)}</p>
            </div>
            <span class="pill soft">${journal.lines.length} lines</span>
          </header>
          ${journal.lines
            .map(
              (line) => `
                <div class="coa-item">
                  <div>
                    <h4>${line.account}</h4>
                    <p>${line.type}</p>
                  </div>
                  <strong>${currency(line.amount)}</strong>
                </div>
              `
            )
            .join("")}
        </article>
      `
    )
    .join("");
}

function renderMasterCategorySelect() {
  const select = document.getElementById("master-category-select");
  select.innerHTML = state.masterCategories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join("");
  select.value = ui.selectedMasterCategoryId;
}

function renderMasterCategoryFilterOptions() {
  const select = document.getElementById("master-category-filter");
  const current = ui.masterCategoryFilter;
  select.innerHTML = [
    `<option value="all">Semua kategori</option>`,
    ...state.masterCategories.map((category) => `<option value="${category.id}">${category.name}</option>`)
  ].join("");
  select.value = current;
}

function renderCompanyForm() {
  const form = document.getElementById("company-form");
  const panel = document.getElementById("company-form-panel");
  const company = state.companies.find((item) => item.id === ui.editingCompanyId);

  panel.classList.toggle("app-hidden", !ui.companyFormOpen);
  form.companyId.value = company?.id || "";
  form.code.value = company?.code || "";
  form.name.value = company?.name || "";
  form.type.value = company?.type || "";
  form.status.value = company?.status || "active";
  form.address.value = company?.address || "";
  form.isDefault.checked = company?.isDefault || false;
}

function companyActionIcons(company) {
  const toggleLabel = company.status === "active" ? "Nonaktifkan" : "Aktifkan";
  return `
    <div class="icon-group">
      <button class="icon-button" title="View company" data-action="view-company" data-id="${company.id}" type="button">👁</button>
      <button class="icon-button" title="Edit company" data-action="edit-company" data-id="${company.id}" type="button">✎</button>
      <button class="icon-button" title="${toggleLabel}" data-action="toggle-company" data-id="${company.id}" type="button">⏻</button>
    </div>
  `;
}

function renderCompanyList() {
  const container = document.getElementById("company-list");

  if (!state.companies.length) {
    container.innerHTML = `<div class="empty-state">Belum ada company.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="master-table company-table">
      <div class="master-table-head company-table-head">
        <span>Kode Company</span>
        <span>Nama Company</span>
        <span>Tipe</span>
        <span>Default Login</span>
        <span>Status</span>
        <span>Aksi</span>
      </div>
      ${state.companies
        .map(
          (company) => `
            <div class="master-table-row company-table-row">
              <span>${company.code}</span>
              <span>${company.name}</span>
              <span>${company.type}</span>
              <span>${company.isDefault ? "Ya" : "Tidak"}</span>
              <span class="status-text ${company.status === "active" ? "ok" : "muted"}">${companyStatusLabel(company.status)}</span>
              <span>${companyActionIcons(company)}</span>
            </div>
            <div class="company-address-row">${company.address || "-"}</div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderUserCompanyOptions(user) {
  const container = document.getElementById("user-company-options");
  const selectedIds = new Set(user?.companyIds || [state.session.activeCompanyId].filter(Boolean));

  container.innerHTML = state.companies
    .map(
      (company) => `
        <label class="checkbox-card">
          <input name="companyIds" type="checkbox" value="${company.id}" ${selectedIds.has(company.id) ? "checked" : ""} />
          <span>
            <strong>${company.name}</strong>
            <small>${company.code} - ${companyStatusLabel(company.status)}</small>
          </span>
        </label>
      `
    )
    .join("");
}

function renderUserRoleOptions(user) {
  const container = document.getElementById("user-role-options");
  const selectedRoles = new Set(user?.roles || ["user_maker"]);

  container.innerHTML = activeRoles()
    .map(
      (role) => `
        <label class="checkbox-card">
          <input name="roles" type="checkbox" value="${role.id}" ${selectedRoles.has(role.id) ? "checked" : ""} />
          <span>
            <strong>${role.name}</strong>
            <small>${roleModules(role.id).length} menu aktif</small>
          </span>
        </label>
      `
    )
    .join("");
}

function renderUserForm() {
  const form = document.getElementById("user-form");
  const panel = document.getElementById("user-form-panel");
  const user = getUserById(ui.editingUserId);

  panel.classList.toggle("app-hidden", !ui.userFormOpen);
  form.userId.value = user?.id || "";
  form.name.value = user?.name || "";
  form.email.value = user?.email || "";
  form.password.value = user?.password || "";
  form.status.value = user?.status || "active";
  renderUserCompanyOptions(user);
  renderUserRoleOptions(user);
}

function userActionIcons(user) {
  const toggleLabel = user.status === "active" ? "Nonaktifkan" : "Aktifkan";
  const isCurrentUser = user.id === state.session.userId;
  return `
    <div class="icon-group">
      <button class="icon-button" title="View user" data-action="view-user" data-id="${user.id}" type="button">&#128065;</button>
      <button class="icon-button" title="Edit user" data-action="edit-user" data-id="${user.id}" type="button">&#9998;</button>
      <button class="icon-button" title="${isCurrentUser ? "User login aktif tidak bisa dinonaktifkan" : toggleLabel}" data-action="toggle-user" data-id="${user.id}" type="button" ${isCurrentUser ? "disabled" : ""}>&#8635;</button>
    </div>
  `;
}

function renderUserList() {
  const container = document.getElementById("user-list");
  const users = state.users;

  if (!users.length) {
    container.innerHTML = `<div class="empty-state">Belum ada user login.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="master-table user-table">
      <div class="master-table-head user-table-head">
        <span>Nama User</span>
        <span>Email / Username</span>
        <span>Data Usaha</span>
        <span>Roles</span>
        <span>Status</span>
        <span>Aksi</span>
      </div>
      ${users
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "id"))
        .map((user) => {
          const companyNames = (user.companyIds || [])
            .map((id) => getCompanyById(id)?.name)
            .filter(Boolean)
            .join(", ");
          return `
            <div class="master-table-row user-table-row">
              <span>${user.name}</span>
              <span>${user.email}</span>
              <span>${companyNames || "-"}</span>
              <span>${getUserRoleLabels(user).join(", ") || "-"}</span>
              <span class="status-text ${user.status === "active" ? "ok" : "muted"}">${companyStatusLabel(user.status)}</span>
              <span>${userActionIcons(user)}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderRoleSelect() {
  const select = document.getElementById("role-select");
  const roles = state.roles || defaultRoles;

  if (!roles.some((role) => role.id === ui.selectedRoleId)) {
    ui.selectedRoleId = roles[0]?.id || "";
  }

  select.innerHTML = roles
    .map((role) => `<option value="${role.id}">${role.name}</option>`)
    .join("");
  select.value = ui.selectedRoleId;
}

function renderRoleMenuOptions() {
  const container = document.getElementById("role-menu-options");
  const role = getRoleById(ui.selectedRoleId);
  const selectedModules = new Set(role?.modules || []);

  container.innerHTML = moduleCatalog
    .map(
      (menu) => `
        <label class="checkbox-card">
          <input name="modules" type="checkbox" value="${menu.id}" ${selectedModules.has(menu.id) ? "checked" : ""} />
          <span>
            <strong>${menu.label}</strong>
            <small>${menu.group}</small>
          </span>
        </label>
      `
    )
    .join("");
}

function renderRoleForm() {
  const form = document.getElementById("role-form");
  const role = getRoleById(ui.selectedRoleId) || defaultRoles[0];

  if (role && ui.selectedRoleId !== role.id) {
    ui.selectedRoleId = role.id;
  }

  renderRoleSelect();
  form.roleName.value = role?.name || "";
  renderRoleMenuOptions();
}

function roleActionIcons(role) {
  return `
    <div class="icon-group">
      <button class="icon-button" title="Edit akses role" data-action="edit-role-access" data-id="${role.id}" type="button">&#9998;</button>
    </div>
  `;
}

function renderRoleList() {
  const container = document.getElementById("role-list");
  const roles = state.roles || defaultRoles;

  container.innerHTML = `
    <div class="master-table role-table">
      <div class="master-table-head role-table-head">
        <span>Nama Role</span>
        <span>Menu Access</span>
        <span>Total Menu</span>
        <span>Status</span>
        <span>Aksi</span>
      </div>
      ${roles
        .map((role) => {
          const moduleNames = (role.modules || [])
            .map((id) => moduleCatalog.find((menu) => menu.id === id)?.label || id)
            .join(", ");
          return `
            <div class="master-table-row role-table-row">
              <span>${role.name}</span>
              <span>${moduleNames || "-"}</span>
              <span>${(role.modules || []).length} menu</span>
              <span class="status-text ${role.status === "active" ? "ok" : "muted"}">${companyStatusLabel(role.status || "active")}</span>
              <span>${roleActionIcons(role)}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderVendorForm() {
  const form = document.getElementById("vendor-form");
  const panel = document.getElementById("vendor-form-panel");
  const vendor = companyScoped(state.vendors).find((item) => item.id === ui.editingVendorId);

  panel.classList.toggle("app-hidden", !ui.vendorFormOpen);
  form.vendorId.value = vendor?.id || "";
  form.code.value = vendor?.code || "";
  form.name.value = vendor?.name || "";
  form.contactPerson.value = vendor?.contactPerson || "";
  form.email.value = vendor?.email || "";
  form.type.value = vendor?.type || "";
  form.status.value = vendor?.status || "active";
  form.address.value = vendor?.address || "";
  form.note.value = vendor?.note || "";
}

function vendorActionIcons(vendor) {
  const toggleLabel = vendor.status === "active" ? "Nonaktifkan" : "Aktifkan";
  return `
    <div class="icon-group">
      <button class="icon-button" title="View vendor" data-action="view-vendor" data-id="${vendor.id}" type="button">&#128065;</button>
      <button class="icon-button" title="Edit vendor" data-action="edit-vendor" data-id="${vendor.id}" type="button">&#9998;</button>
      <button class="icon-button" title="${toggleLabel}" data-action="toggle-vendor" data-id="${vendor.id}" type="button">&#8635;</button>
    </div>
  `;
}

function renderVendorList() {
  const container = document.getElementById("vendor-list");
  const vendors = companyScoped(state.vendors);

  if (!vendors.length) {
    container.innerHTML = `<div class="empty-state">Belum ada vendor untuk company aktif.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="master-table vendor-table">
      <div class="master-table-head vendor-table-head">
        <span>Kode Vendor</span>
        <span>Nama Vendor</span>
        <span>PIC</span>
        <span>Email</span>
        <span>Tipe</span>
        <span>Status</span>
        <span>Aksi</span>
      </div>
      ${vendors
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "id"))
        .map(
          (vendor) => `
            <div class="master-table-row vendor-table-row">
              <span>${vendor.code}</span>
              <span>${vendor.name}</span>
              <span>${vendor.contactPerson}</span>
              <span>${vendor.email}</span>
              <span>${vendor.type}</span>
              <span class="status-text ${vendor.status === "active" ? "ok" : "muted"}">${companyStatusLabel(vendor.status)}</span>
              <span>${vendorActionIcons(vendor)}</span>
            </div>
            <div class="vendor-address-row">${vendor.address || "-"}</div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderReferenceForm() {
  const form = document.getElementById("reference-form");
  const panel = document.getElementById("reference-editor-panel");
  const category = getMasterCategoryById(ui.selectedMasterCategoryId);
  const value = category?.values.find((item) => item.id === ui.editingReferenceValueId);

  panel.classList.toggle("app-hidden", !ui.referenceEditorOpen);
  form.valueId.value = value?.id || "";
  form.code.value = value?.code || "";
  form.name.value = value?.name || "";
  form.status.value = value?.status || "active";
}

function referenceActionIcons(value) {
  const toggleLabel = value.status === "active" ? "Nonaktifkan" : "Aktifkan";
  return `
    <div class="icon-group">
      <button class="icon-button" title="View nilai" data-action="view-reference" data-id="${value.id}" type="button">👁</button>
      <button class="icon-button" title="Edit nilai" data-action="edit-reference" data-id="${value.id}" type="button">✎</button>
      <button class="icon-button" title="${toggleLabel}" data-action="toggle-reference" data-id="${value.id}" type="button">⏻</button>
    </div>
  `;
}

function renderReferenceList() {
  const container = document.getElementById("reference-list");
  const search = ui.masterSearch.trim().toLowerCase();
  const selectedCategory = ui.masterCategoryFilter;
  const selectedStatus = ui.masterStatusFilter;
  const categories = state.masterCategories
    .filter((category) => selectedCategory === "all" || category.id === selectedCategory)
    .map((category) => {
      const values = category.values.filter((value) => {
        const statusMatch = selectedStatus === "all" || value.status === selectedStatus;
        const searchTarget = `${value.code} ${value.name} ${category.name}`.toLowerCase();
        const searchMatch = !search || searchTarget.includes(search);
        return statusMatch && searchMatch;
      });

      return {
        ...category,
        filteredValues: values
      };
    })
    .filter((category) => category.filteredValues.length > 0);

  if (!categories.length) {
    container.innerHTML = `<div class="empty-state">Tidak ada nilai master yang cocok dengan filter.</div>`;
    return;
  }

  container.innerHTML = categories
    .map(
      (category) => `
        <article class="panel category-panel">
          <div class="panel-header">
            <div>
              <h3>${category.name}</h3>
              <p>${category.description}</p>
            </div>
            ${
              userHasRole("administrator")
                ? `<button class="button action-button" type="button" data-action="open-reference-editor" data-id="${category.id}">Tambah Nilai</button>`
                : `<span class="pill soft">${category.filteredValues.length} nilai</span>`
            }
          </div>
          <div class="master-table">
            <div class="master-table-head">
              <span>Kode</span>
              <span>Nama Nilai</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>
            ${category.filteredValues
              .map(
                (value) => `
                  <div class="master-table-row">
                    <span>${value.code}</span>
                    <span>${value.name}</span>
                    <span class="status-text ${value.status === "active" ? "ok" : "muted"}">${companyStatusLabel(value.status)}</span>
                    <span>${referenceActionIcons(value)}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderMasterAdminSummary() {
  const container = document.getElementById("master-stats");
  const totalCategories = state.masterCategories.length;
  const activeCount = state.masterCategories.reduce(
    (total, category) => total + category.values.filter((item) => item.status === "active").length,
    0
  );
  const inactiveCount = state.masterCategories.reduce(
    (total, category) => total + category.values.filter((item) => item.status !== "active").length,
    0
  );
  const adminCount = state.users.filter((user) => user.roles.includes("administrator") && user.status === "active").length;

  container.innerHTML = `
    <div class="stat-card stat-card-blue">
      <h3>Total Kategori</h3>
      <strong>${totalCategories}</strong>
      <p>Kategori master aktif</p>
    </div>
    <div class="stat-card stat-card-warm">
      <h3>Nilai Aktif</h3>
      <strong>${activeCount}</strong>
      <p>Dipakai di proses transaksi</p>
    </div>
    <div class="stat-card stat-card-green">
      <h3>Nilai Nonaktif</h3>
      <strong>${inactiveCount}</strong>
      <p>Masih tersimpan historis</p>
    </div>
    <div class="stat-card stat-card-rose">
      <h3>Administrator</h3>
      <strong>${adminCount}</strong>
      <p>Full access master</p>
    </div>
  `;
}

function renderCompanyManagementSection() {
  const note = document.getElementById("company-access-note");
  const isAdmin = userHasRole("administrator");

  setFormDisabled("company-form", !isAdmin);
  document.getElementById("company-reset").disabled = !isAdmin;

  note.innerHTML = isAdmin
    ? `<div class="access-note ok">Mode administrator aktif. Anda dapat mengelola company yang dipakai di seluruh proses.</div>`
    : `<div class="access-note warn">Menu Data Usaha hanya dapat diubah oleh role Administrator.</div>`;

  renderCompanyForm();
  renderCompanyList();
}

function renderVendorManagementSection() {
  const note = document.getElementById("vendor-access-note");
  const isAdmin = userHasRole("administrator");

  setFormDisabled("vendor-form", !isAdmin);
  document.getElementById("vendor-reset").disabled = !isAdmin;

  note.innerHTML = isAdmin
    ? `<div class="access-note ok">Mode administrator aktif. Anda dapat mengelola vendor untuk Data Usaha aktif.</div>`
    : `<div class="access-note warn">Menu Master Vendor hanya dapat diubah oleh role Administrator.</div>`;

  renderVendorForm();
  renderVendorList();
}

function renderUserManagementSection() {
  const note = document.getElementById("user-access-note");
  const isAdmin = userHasRole("administrator");

  note.innerHTML = isAdmin
    ? `<div class="access-note ok">Mode administrator aktif. Anda dapat mengelola user login, akses PT, dan role.</div>`
    : `<div class="access-note warn">Menu User Management hanya dapat diubah oleh role Administrator.</div>`;

  renderUserForm();
  setFormDisabled("user-form", !isAdmin);
  document.getElementById("user-reset").disabled = !isAdmin;
  document.getElementById("user-open-form").disabled = !isAdmin;
  renderUserList();
}

function renderRoleManagementSection() {
  const note = document.getElementById("role-access-note");
  const isAdmin = userHasRole("administrator");

  note.innerHTML = isAdmin
    ? `<div class="access-note ok">Mode administrator aktif. Anda dapat mengatur akses menu per role.</div>`
    : `<div class="access-note warn">Menu Roles Management hanya dapat diubah oleh role Administrator.</div>`;

  renderRoleForm();
  setFormDisabled("role-form", !isAdmin);
  document.getElementById("role-reset").disabled = !isAdmin;
  renderRoleList();
}

function setFormDisabled(formId, disabled) {
  const form = document.getElementById(formId);
  Array.from(form.elements).forEach((element) => {
    element.disabled = disabled;
  });
}

function renderMasterSection() {
  const note = document.getElementById("master-access-note");
  const isAdmin = userHasRole("administrator");

  setFormDisabled("reference-form", !isAdmin);
  document.getElementById("master-category-select").disabled = !isAdmin;
  document.getElementById("reference-reset").disabled = !isAdmin;

  note.innerHTML = isAdmin
    ? `<div class="access-note ok">Mode administrator aktif. Anda dapat mengelola kategori dan nilai master.</div>`
    : `<div class="access-note warn">Menu master hanya dapat diubah oleh role Administrator.</div>`;

  document.getElementById("master-search-input").value = ui.masterSearch;
  document.getElementById("master-status-filter").value = ui.masterStatusFilter;
  renderMasterCategoryFilterOptions();
  document.getElementById("master-category-filter").value = ui.masterCategoryFilter;
  renderMasterCategorySelect();
  renderReferenceForm();
  renderReferenceList();
  renderMasterAdminSummary();
}

function refreshAll() {
  saveState();
  renderShellVisibility();
  renderLoginCompanies();

  if (!state.session.isLoggedIn || !getCurrentUser() || !safeCurrentCompany()) {
    return;
  }

  renderSessionSummary();
  renderCompanySwitcher();
  renderNavigation();
  renderStats();
  renderDashboardPrPoList();
  renderCoaOptions();
  renderMasterReferenceOptions();
  renderPrForm();
  renderPrComposer();
  renderPrDraftPreview();
  renderPrApproverPreview();
  renderPrList();
  renderPrDetailPanel();
  renderApprovalList();
  renderApprovedPrOptions();
  renderPoForm();
  renderPoList();
  renderPoDetailPanel();
  renderIssuedPoOptions();
  renderReceiveList();
  renderCoaList();
  renderJournalList();
  renderCompanyManagementSection();
  renderUserManagementSection();
  renderRoleManagementSection();
  renderVendorManagementSection();
  renderMasterSection();
}

function submitLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const companyId = formData.get("companyId");
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const message = document.getElementById("login-message");
  const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password);

  if (!user || user.status !== "active") {
    message.textContent = "Email atau password tidak valid.";
    message.className = "form-message error";
    return;
  }

  if (!user.companyIds.includes(companyId)) {
    message.textContent = "User ini tidak punya akses ke company yang dipilih.";
    message.className = "form-message error";
    return;
  }

  const company = getCompanyById(companyId);
  if (!company || company.status !== "active") {
    message.textContent = "Company yang dipilih tidak aktif.";
    message.className = "form-message error";
    return;
  }

  state.session = {
    isLoggedIn: true,
    userId: user.id,
    activeCompanyId: companyId
  };

  message.textContent = "";
  event.target.reset();
  ui.activeSection = "dashboard";
  ui.prFormOpen = false;
  ui.prDraftItems = [];
  ui.selectedPrDetailId = "";
  ui.poDraftItems = [];
  ui.poDraftApprovers = [];
  ui.editingPoApproverIndex = -1;
  ui.poDraftQuotations = [];
  ui.editingPoQuotationIndex = -1;
  ui.poFormOpen = false;
  ui.selectedPoDetailPrId = "";
  ui.selectedPoCreatePrId = "";
  refreshAll();
}

function logout() {
  state.session = {
    isLoggedIn: false,
    userId: "",
    activeCompanyId: ""
  };

  ui.activeSection = "dashboard";
  ui.prFormOpen = false;
  ui.prDraftItems = [];
  ui.selectedPrDetailId = "";
  ui.poDraftItems = [];
  ui.poDraftApprovers = [];
  ui.editingPoApproverIndex = -1;
  ui.poDraftQuotations = [];
  ui.editingPoQuotationIndex = -1;
  ui.poFormOpen = false;
  ui.selectedPoDetailPrId = "";
  ui.selectedPoCreatePrId = "";
  refreshAll();
}

function submitPr(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  if (!ui.prDraftItems.length) {
    return;
  }

  const category = getPrDraftCategoryValue();
  const defaultCoaCode = category === "non_asset" ? "5101" : "1502";
  const subtotalAmount = getPrDraftTotal();
  const title =
    ui.prDraftItems.length === 1
      ? ui.prDraftItems[0].name
      : `${ui.prDraftItems[0].name} + ${ui.prDraftItems.length - 1} item lainnya`;
  const detailSummary = ui.prDraftItems
    .map((item) => `${item.name} (${item.qty} x ${currency(item.price)})`)
    .join("; ");
  const payload = {
    title,
    requester: formData.get("requester"),
    department: formData.get("department"),
    costCenter: String(formData.get("useLocation") || "").trim(),
    needByDate: String(formData.get("needByDate") || ""),
    requestNote: String(formData.get("requestNote") || "").trim(),
    requestTypeId: formData.get("requestType"),
    priorityId: formData.get("priority"),
    amount: subtotalAmount,
    vatPercent: 0,
    vatAmount: 0,
    totalAmount: subtotalAmount,
    vendorSuggestion: "",
    category,
    coaCode: formData.get("coaCode") || defaultCoaCode,
    description: detailSummary,
    items: ui.prDraftItems.map((item) => ({ ...item })),
    approvalSetup: ui.prDraftApprovers.map((item) => ({ ...item }))
  };

  const existingPr = ui.editingPrId ? getPrById(ui.editingPrId) : null;

  if (existingPr && existingPr.companyId === state.session.activeCompanyId && existingPr.status !== "approved") {
    Object.assign(existingPr, payload, {
      companyCode: getCompanyCodeSnapshot(existingPr.companyId),
      status: "submitted",
      approvalStage: "dept_head"
    });
    existingPr.history = [...(existingPr.history || []), "PR diperbarui dan diajukan ulang"];
    ui.selectedPrDetailId = existingPr.id;
  } else {
    const createdAt = new Date().toISOString();
    const pr = {
      id: buildDocumentNumber(state.session.activeCompanyId, "PR", createdAt, state.purchaseRequests),
      companyId: state.session.activeCompanyId,
      companyCode: getCompanyCodeSnapshot(state.session.activeCompanyId),
      ...payload,
      status: "submitted",
      approvalStage: "dept_head",
      createdAt,
      history: ["Submitted oleh requester"]
    };

    state.purchaseRequests.push(pr);
    ui.selectedPrDetailId = pr.id;
  }

  event.target.reset();
  ui.prFormOpen = false;
  ui.prDraftItems = [];
  ui.editingPrItemIndex = -1;
  ui.prDraftApprovers = [];
  ui.editingPrApproverIndex = -1;
  ui.editingPrId = "";
  renderMasterReferenceOptions();
  refreshAll();
}

function approvePr(id) {
  const pr = getPrById(id);
  if (!pr || pr.companyId !== state.session.activeCompanyId) {
    return;
  }

  if (pr.status === "submitted") {
    if (pr.amount > FINAL_APPROVAL_THRESHOLD) {
      pr.status = "waiting_finance";
      pr.approvalStage = "finance";
      pr.history.push("Approved Dept Head");
    } else {
      pr.status = "approved";
      pr.approvalStage = "done";
      pr.history.push("Approved Dept Head");
    }
  } else if (pr.status === "waiting_finance") {
    pr.status = "approved";
    pr.approvalStage = "done";
    pr.history.push("Approved Finance / Direktur");
  }

  refreshAll();
}

function rejectPr(id) {
  const pr = getPrById(id);
  if (!pr || pr.companyId !== state.session.activeCompanyId) {
    return;
  }

  pr.status = "rejected";
  pr.approvalStage = "done";
  pr.history.push("Rejected");
  refreshAll();
}

function resendApprovalEmail(type, id, index) {
  const collection = type === "po" ? state.purchaseOrders : state.purchaseRequests;
  const document = companyScoped(collection).find((item) => item.id === id);

  if (!document || !Array.isArray(document.approvalSetup) || !document.approvalSetup[index]) {
    return;
  }

  const entry = document.approvalSetup[index];
  entry.lastEmailSentAt = new Date().toISOString();
  document.history = [
    ...(document.history || []),
    `Email approval dikirim ulang ke ${entry.name || entry.email || "approver"}`
  ];
  refreshAll();
}

function submitPo(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const prId = formData.get("prId");
  const pr = getPrById(prId);
  const vendor = getVendorById(formData.get("vendorName"));

  if (
    !pr ||
    pr.companyId !== state.session.activeCompanyId ||
    !ui.poDraftItems.length ||
    !ui.poDraftApprovers.length ||
    !ui.poDraftQuotations.length
  ) {
    return;
  }

  const createdAt = new Date().toISOString();
  const subtotalAmount = getPoSourceSubtotal();
  const vatPercent = getPoDraftVatPercent();
  const vatAmount = getPoDraftVatAmount();
  const totalAmount = getPoDraftGrandTotal();
  const status = totalAmount > PO_APPROVAL_THRESHOLD ? "waiting_approval" : "issued";
  const po = {
    id: buildDocumentNumber(state.session.activeCompanyId, "PO", createdAt, state.purchaseOrders),
    companyId: state.session.activeCompanyId,
    companyCode: getCompanyCodeSnapshot(state.session.activeCompanyId),
    prId,
    vendorName: vendor?.name || "",
    paymentTerm: formData.get("paymentTerm"),
    needBy: formData.get("needBy"),
    amount: subtotalAmount,
    vatPercent,
    vatAmount,
    totalAmount,
    items: ui.poDraftItems.map((item) => ({ ...item })),
    status,
    quotations: ui.poDraftQuotations.map((item) => ({ ...item })),
    approvalSetup: ui.poDraftApprovers.map((item) => ({ ...item })),
    createdAt,
    history: [
      "PO dibuat dari PR approved",
      status === "issued" ? "PO issued ke vendor" : "PO menunggu approval tambahan"
    ]
  };

  state.purchaseOrders.push(po);
  event.target.reset();
  ui.poFormOpen = false;
  ui.selectedPoCreatePrId = "";
  ui.poDraftItems = [];
  ui.poDraftApprovers = [];
  ui.editingPoApproverIndex = -1;
  ui.poDraftQuotations = [];
  ui.editingPoQuotationIndex = -1;
  refreshAll();
}

function approvePo(id) {
  const po = getPoById(id);
  if (!po || po.companyId !== state.session.activeCompanyId) {
    return;
  }

  po.status = "issued";
  po.history.push("PO approved dan issued ke vendor");
  refreshAll();
}

function rejectPo(id) {
  const po = getPoById(id);
  if (!po || po.companyId !== state.session.activeCompanyId) {
    return;
  }

  po.status = "rejected";
  po.history.push("PO rejected");
  refreshAll();
}

function submitReceive(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const poId = formData.get("poId");
  const po = getPoById(poId);
  const pr = po ? getPrById(po.prId) : null;

  if (!po || !pr || po.companyId !== state.session.activeCompanyId) {
    return;
  }

  const poItems = getPoLineItems(po);
  const receiveBasis = normalizeReceiveBasisForPo(po, formData.get("receiveBasis") || "quantity");
  const receivedItems = poItems
    .map((item, index) => {
      const qtyReceived = Number(formData.get(`receiveQty-${index}`) || 0);
      const remainingQty = getPoRemainingQty(po, index);
      const lineAmount = getPoLineTotalAmount(item);
      const remainingAmount = getPoRemainingAmount(po, index);
      const manualAmount = Number(formData.get(`receiveAmount-${index}`) || 0);
      const quantityAmount = qtyReceived * Number(item.price || 0) * (1 + Number(getItemVatPercent(item) || 0) / 100);
      const deliverableName = String(formData.get(`deliverableName-${index}`) || "").trim();
      const isFinalDeliverable = formData.get(`deliverableFinal-${index}`) === "on";
      const amountReceived = receiveBasis === "quantity" ? quantityAmount : manualAmount;
      return {
        itemIndex: index,
        name: item.name,
        category: item.category,
        type: getReceiveLineType(item),
        orderedQty: Number(item.qty || 0),
        previousReceivedQty: getReceivedQty(po.id, index),
        poLineAmount: lineAmount,
        previousReceivedAmount: getReceivedAmount(po.id, index),
        remainingQty,
        remainingAmount,
        qtyReceived,
        price: Number(item.price || 0),
        vatPercent: getItemVatPercent(item),
        amountReceived,
        deliverableName,
        isFinalDeliverable
      };
    })
    .filter((item) => {
      if (receiveBasis === "quantity") {
        return item.qtyReceived > 0;
      }

      if (receiveBasis === "deliverable") {
        return item.amountReceived > 0 || item.deliverableName || item.isFinalDeliverable;
      }

      return item.amountReceived > 0;
    });
  const invalidQty = receivedItems.some((item) => receiveBasis === "quantity" && item.qtyReceived > item.remainingQty);
  const invalidAmount = receivedItems.some(
    (item) => ["amount", "deliverable"].includes(receiveBasis) && item.amountReceived > item.remainingAmount
  );
  const invalidDeliverable = receivedItems.some(
    (item) => receiveBasis === "deliverable" && (!item.deliverableName || item.amountReceived <= 0)
  );
  const handoverFile = formData.get("handoverFile");

  if (!receivedItems.length || invalidQty || invalidAmount || invalidDeliverable || !handoverFile?.name) {
    return;
  }

  const allowedFile = /\.(pdf|jpe?g|png)$/i.test(handoverFile.name);
  if (!allowedFile) {
    return;
  }

  const receiveTypes = [...new Set(receivedItems.map((item) => item.category === "non_asset" ? "non_asset" : "asset"))];
  const receiveType = receiveTypes.length > 1 ? "mixed" : receiveTypes[0];
  const journalId = nextId("JRN", "journal");
  const hasAsset = receivedItems.some((item) => item.category !== "non_asset");
  const coa = getCoaByCode(pr.coaCode) || getCoaByCode(hasAsset ? "1501" : "5101");
  const amount = receivedItems.reduce((total, item) => total + Number(item.amountReceived || 0), 0);
  const createdAt = new Date().toISOString();
  const receiptId = buildDocumentNumber(state.session.activeCompanyId, "RCV", createdAt, state.receipts);

  const receipt = {
    id: receiptId,
    companyId: state.session.activeCompanyId,
    poId,
    prId: pr.id,
    receiver: formData.get("receiver"),
    receiveType,
    receiveBasis,
    documentType: formData.get("documentType"),
    documentRef: formData.get("documentRef"),
    documentFileName: handoverFile.name,
    note: formData.get("note"),
    amount,
    items: receivedItems,
    createdAt,
    assetNumber: hasAsset ? `AST-${new Date().getFullYear()}-${String(state.receipts.length + 1).padStart(4, "0")}` : ""
  };

  const journal = {
    id: journalId,
    companyId: state.session.activeCompanyId,
    sourceId: receiptId,
    createdAt,
    lines: [
      {
        account: `${coa.code} - ${coa.name}`,
        type: "Debit",
        amount
      },
      {
        account: "2105 - GR/IR Clearing",
        type: "Credit",
        amount
      }
    ]
  };

  state.receipts.push(receipt);
  state.journals.push(journal);
  po.status = poHasRemainingReceiveProgress(po) ? "partial_received" : "received";
  po.history.push(
    po.status === "received"
      ? `PO sudah di-receive penuh berdasarkan ${RECEIVE_BASIS_LABELS[receiveBasis]}`
      : `PO partial receive berdasarkan ${RECEIVE_BASIS_LABELS[receiveBasis]}`
  );
  event.target.reset();
  ui.receiveBasis = "quantity";
  ui.receiveFormOpen = false;
  ui.selectedReceivePoId = "";
  refreshAll();
}

function submitCompany(event) {
  event.preventDefault();
  if (!userHasRole("administrator")) {
    return;
  }

  const formData = new FormData(event.target);
  const existingId = formData.get("companyId");
  const payload = {
    code: formData.get("code"),
    name: formData.get("name"),
    type: formData.get("type"),
    status: formData.get("status"),
    address: formData.get("address"),
    isDefault: formData.get("isDefault") === "on"
  };

  if (payload.isDefault) {
    state.companies.forEach((company) => {
      company.isDefault = false;
    });
  }

  if (existingId) {
    const company = getCompanyById(existingId);
    if (!company) {
      return;
    }
    Object.assign(company, payload);
  } else {
    state.companies.push({
      id: nextId("CMP", "company"),
      ...payload
    });
  }

  ui.editingCompanyId = "";
  ui.companyFormOpen = false;
  refreshAll();
}

function submitVendor(event) {
  event.preventDefault();
  if (!userHasRole("administrator")) {
    return;
  }

  const company = getCurrentCompany();
  if (!company) {
    return;
  }

  const formData = new FormData(event.target);
  const existingId = formData.get("vendorId");
  const payload = {
    companyId: company.id,
    code: String(formData.get("code")).trim(),
    name: String(formData.get("name")).trim(),
    contactPerson: String(formData.get("contactPerson")).trim(),
    email: String(formData.get("email")).trim(),
    type: String(formData.get("type")).trim(),
    status: formData.get("status"),
    address: String(formData.get("address")).trim(),
    note: String(formData.get("note")).trim()
  };

  if (existingId) {
    const vendor = companyScoped(state.vendors).find((item) => item.id === existingId);
    if (!vendor) {
      return;
    }
    Object.assign(vendor, payload);
  } else {
    state.vendors.push({
      id: nextId("VND", "vendor"),
      ...payload
    });
  }

  ui.editingVendorId = "";
  ui.vendorFormOpen = false;
  refreshAll();
}

function submitUser(event) {
  event.preventDefault();
  if (!userHasRole("administrator")) {
    return;
  }

  const formData = new FormData(event.target);
  const existingId = formData.get("userId");
  const companyIds = formData.getAll("companyIds");
  const roles = formData.getAll("roles");

  if (!companyIds.length || !roles.length) {
    return;
  }

  const payload = {
    name: String(formData.get("name")).trim(),
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")).trim(),
    roles,
    companyIds,
    status: formData.get("status")
  };

  const duplicateEmail = state.users.some(
    (user) => user.id !== existingId && user.email.toLowerCase() === payload.email
  );
  if (duplicateEmail) {
    return;
  }

  if (existingId) {
    const user = getUserById(existingId);
    if (!user) {
      return;
    }

    Object.assign(user, payload);
  } else {
    state.users.push({
      id: nextId("USR", "user"),
      ...payload
    });
  }

  ui.editingUserId = "";
  ui.userFormOpen = false;
  refreshAll();
}

function submitRoleAccess(event) {
  event.preventDefault();
  if (!userHasRole("administrator")) {
    return;
  }

  const formData = new FormData(event.target);
  const roleId = formData.get("roleId");
  const role = getRoleById(roleId);
  const selectedModules = [...new Set(["dashboard", ...formData.getAll("modules")])];

  if (roleId === "administrator" && !selectedModules.includes("role-management")) {
    selectedModules.push("role-management");
  }

  if (!role) {
    return;
  }

  role.name = String(formData.get("roleName")).trim() || role.name;
  role.modules = selectedModules;
  role.status = role.status || "active";
  ui.selectedRoleId = role.id;

  refreshAll();
}

function submitReference(event) {
  event.preventDefault();
  if (!userHasRole("administrator")) {
    return;
  }

  const category = getMasterCategoryById(ui.selectedMasterCategoryId);
  if (!category) {
    return;
  }

  const formData = new FormData(event.target);
  const existingId = formData.get("valueId");
  const payload = {
    code: formData.get("code"),
    name: formData.get("name"),
    status: formData.get("status")
  };

  if (existingId) {
    const value = category.values.find((item) => item.id === existingId);
    if (!value) {
      return;
    }
    Object.assign(value, payload);
  } else {
    category.values.push({
      id: nextId("MST", "masterValue"),
      ...payload
    });
  }

  ui.editingReferenceValueId = "";
  ui.referenceEditorOpen = false;
  refreshAll();
}

function editCompany(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  ui.editingCompanyId = id;
  ui.companyFormOpen = true;
  renderCompanyForm();
  document.getElementById("company-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editUser(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  ui.editingUserId = id;
  ui.userFormOpen = true;
  renderUserForm();
  document.getElementById("user-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editReference(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  const category = findCategoryByValueId(id);
  if (category) {
    ui.selectedMasterCategoryId = category.id;
  }
  ui.editingReferenceValueId = id;
  ui.referenceEditorOpen = true;
  renderReferenceForm();
  document.getElementById("reference-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editVendor(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  ui.editingVendorId = id;
  ui.vendorFormOpen = true;
  renderVendorForm();
  document.getElementById("vendor-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleCompany(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  const company = getCompanyById(id);
  if (!company) {
    return;
  }

  company.status = company.status === "active" ? "inactive" : "active";

  if (company.id === state.session.activeCompanyId && company.status !== "active") {
    const fallback = activeCompanies().find((item) => getCurrentUser()?.companyIds.includes(item.id));
    state.session.activeCompanyId = fallback?.id || "";
  }

  refreshAll();
}

function toggleUser(id) {
  if (!userHasRole("administrator") || id === state.session.userId) {
    return;
  }

  const user = getUserById(id);
  if (!user) {
    return;
  }

  user.status = user.status === "active" ? "inactive" : "active";
  refreshAll();
}

function toggleReference(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  const category = findCategoryByValueId(id);
  const value = category?.values.find((item) => item.id === id);
  if (!value) {
    return;
  }

  value.status = value.status === "active" ? "inactive" : "active";
  refreshAll();
}

function toggleVendor(id) {
  if (!userHasRole("administrator")) {
    return;
  }

  const vendor = companyScoped(state.vendors).find((item) => item.id === id);
  if (!vendor) {
    return;
  }

  vendor.status = vendor.status === "active" ? "inactive" : "active";
  refreshAll();
}

function viewCompany(id) {
  ui.editingCompanyId = id;
  ui.companyFormOpen = true;
  renderCompanyForm();
}

function viewUser(id) {
  ui.editingUserId = id;
  ui.userFormOpen = true;
  renderUserForm();
}

function viewReference(id) {
  const category = findCategoryByValueId(id);
  if (category) {
    ui.selectedMasterCategoryId = category.id;
  }
  ui.editingReferenceValueId = id;
  ui.referenceEditorOpen = true;
  renderReferenceForm();
}

function viewVendor(id) {
  ui.editingVendorId = id;
  ui.vendorFormOpen = true;
  renderVendorForm();
}

function bindForms() {
  document.getElementById("login-form").addEventListener("submit", submitLogin);
  document.getElementById("pr-form").addEventListener("submit", submitPr);
  document.getElementById("po-form").addEventListener("submit", submitPo);
  document.getElementById("receive-form").addEventListener("submit", submitReceive);
  document.getElementById("company-form").addEventListener("submit", submitCompany);
  document.getElementById("user-form").addEventListener("submit", submitUser);
  document.getElementById("role-form").addEventListener("submit", submitRoleAccess);
  document.getElementById("vendor-form").addEventListener("submit", submitVendor);
  document.getElementById("reference-form").addEventListener("submit", submitReference);

  document.getElementById("company-reset").addEventListener("click", () => {
    ui.editingCompanyId = "";
    ui.companyFormOpen = false;
    renderCompanyForm();
  });

  document.getElementById("company-open-form").addEventListener("click", () => {
    ui.editingCompanyId = "";
    ui.companyFormOpen = true;
    renderCompanyForm();
    document.getElementById("company-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("user-reset").addEventListener("click", () => {
    ui.editingUserId = "";
    ui.userFormOpen = false;
    renderUserForm();
  });

  document.getElementById("user-open-form").addEventListener("click", () => {
    ui.editingUserId = "";
    ui.userFormOpen = true;
    renderUserForm();
    document.getElementById("user-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("role-select").addEventListener("change", (event) => {
    ui.selectedRoleId = event.target.value;
    renderRoleForm();
  });

  document.getElementById("role-reset").addEventListener("click", () => {
    const defaultRole = defaultRoles.find((role) => role.id === ui.selectedRoleId);
    const role = getRoleById(ui.selectedRoleId);
    if (defaultRole && role) {
      role.name = defaultRole.name;
      role.modules = [...defaultRole.modules];
      refreshAll();
    }
  });

  document.getElementById("reference-reset").addEventListener("click", () => {
    ui.editingReferenceValueId = "";
    ui.referenceEditorOpen = false;
    renderReferenceForm();
  });

  document.getElementById("vendor-reset").addEventListener("click", () => {
    ui.editingVendorId = "";
    ui.vendorFormOpen = false;
    renderVendorForm();
  });

  document.getElementById("vendor-open-form").addEventListener("click", () => {
    ui.editingVendorId = "";
    ui.vendorFormOpen = true;
    renderVendorForm();
    document.getElementById("vendor-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("pr-reset").addEventListener("click", () => {
    ui.prFormOpen = false;
    ui.prDraftItems = [];
    ui.editingPrItemIndex = -1;
    ui.prDraftApprovers = [];
    ui.editingPrApproverIndex = -1;
    ui.editingPrId = "";
    document.getElementById("pr-form").reset();
    renderMasterReferenceOptions();
    renderPrDraftPreview();
    renderPrApproverPreview();
    renderPrForm();
  });

  document.getElementById("pr-open-form").addEventListener("click", () => {
    ui.prFormOpen = true;
    ui.prDraftItems = [];
    ui.editingPrItemIndex = -1;
    ui.prDraftApprovers = [];
    ui.editingPrApproverIndex = -1;
    ui.editingPrId = "";
    ui.selectedPrDetailId = "";
    document.getElementById("pr-form").reset();
    renderMasterReferenceOptions();
    renderPrComposer();
    renderPrDraftPreview();
    renderPrApproverPreview();
    renderPrForm();
    document.getElementById("pr-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("pr-add-item").addEventListener("click", () => {
    addPrDraftItem();
  });

  document.getElementById("pr-add-approver").addEventListener("click", () => {
    addPrDraftApprover();
  });

  document.getElementById("po-reset").addEventListener("click", () => {
    ui.poFormOpen = false;
    ui.selectedPoCreatePrId = "";
    ui.poDraftApprovers = [];
    ui.editingPoApproverIndex = -1;
    ui.poDraftQuotations = [];
    ui.editingPoQuotationIndex = -1;
    document.getElementById("po-form").reset();
    renderPoForm();
  });

  document.getElementById("po-open-form").addEventListener("click", () => {
    ui.poFormOpen = true;
    ui.selectedPoCreatePrId = "";
    ui.selectedPoDetailPrId = "";
    ui.poDraftItems = [];
    ui.poDraftApprovers = [];
    ui.editingPoApproverIndex = -1;
    ui.poDraftQuotations = [];
    ui.editingPoQuotationIndex = -1;
    document.getElementById("po-form").reset();
    renderApprovedPrOptions();
    loadPoDraftItemsFromSelectedPr();
    renderMasterReferenceOptions();
    renderPoForm();
    document.getElementById("po-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("po-add-approver").addEventListener("click", () => {
    addPoDraftApprover();
  });

  document.getElementById("po-add-quotation").addEventListener("click", () => {
    addPoDraftQuotation();
  });

  document.getElementById("pr-search-input").addEventListener("input", (event) => {
    ui.prSearch = event.target.value;
    ui.prPage = 1;
    renderPrList();
  });

  document.getElementById("po-search-input").addEventListener("input", (event) => {
    ui.poSearch = event.target.value;
    ui.poPage = 1;
    renderPoList();
  });

  document.getElementById("approval-pr-search-input").addEventListener("input", (event) => {
    ui.approvalPrSearch = event.target.value;
    ui.approvalPrPage = 1;
    renderApprovalList();
  });

  document.getElementById("approval-po-search-input").addEventListener("input", (event) => {
    ui.approvalPoSearch = event.target.value;
    ui.approvalPoPage = 1;
    renderApprovalList();
  });

  document.getElementById("pr-form").addEventListener("input", renderPrDraftPreview);
  document.getElementById("pr-form").addEventListener("change", renderPrDraftPreview);
  document.getElementById("approved-pr-select").addEventListener("change", () => {
    renderApprovedPrOptions();
    loadPoDraftItemsFromSelectedPr();
    syncPoFinancialPreview();
  });
  document.getElementById("po-source-preview-body").addEventListener("input", (event) => {
    if (event.target.dataset.action === "update-po-item-vat") {
      event.stopPropagation();
      updatePoDraftItemVat(Number(event.target.dataset.id), event.target.value, false);
    }
  });
  document.getElementById("po-source-preview-body").addEventListener("change", (event) => {
    if (event.target.dataset.action === "update-po-item-vat") {
      event.stopPropagation();
      updatePoDraftItemVat(Number(event.target.dataset.id), event.target.value);
    }
  });
  document.getElementById("po-form").addEventListener("input", syncPoFinancialPreview);
  document.getElementById("po-form").addEventListener("change", syncPoFinancialPreview);
  document.getElementById("receive-basis").addEventListener("change", (event) => {
    ui.receiveBasis = event.target.value;
    renderReceiveLines();
  });
}

function bindActionButtons() {
  document.body.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    const id = event.target.dataset.id;
    const type = event.target.dataset.type;
    const index = event.target.dataset.index;

    if (!action) {
      return;
    }

    if (action === "approve-pr") {
      approvePr(id);
    }

  if (action === "reject-pr") {
    rejectPr(id);
  }

  if (action === "view-pr-detail") {
    ui.selectedPrDetailId = id;
    renderPrDetailPanel();
    document.getElementById("pr-detail-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (action === "edit-pr") {
    beginEditPr(id);
  }

  if (action === "edit-pr-item") {
    beginEditPrItem(Number(id));
  }

  if (action === "delete-pr-item") {
    deletePrDraftItem(Number(id));
  }

  if (action === "edit-pr-approver") {
    beginEditPrApprover(Number(id));
  }

  if (action === "delete-pr-approver") {
    deletePrDraftApprover(Number(id));
  }

  if (action === "edit-po-approver") {
    beginEditPoApprover(Number(id));
  }

  if (action === "delete-po-approver") {
    deletePoDraftApprover(Number(id));
  }

  if (action === "edit-po-quotation") {
    beginEditPoQuotation(Number(id));
  }

    if (action === "delete-po-quotation") {
      deletePoDraftQuotation(Number(id));
    }

  if (action === "paginate-list") {
    const page = Number(event.target.dataset.page) || 1;
    const list = event.target.dataset.list;

    if (list === "pr") {
      ui.prPage = page;
      renderPrList();
    }

    if (list === "po") {
      ui.poPage = page;
      renderPoList();
    }

    if (list === "approval-pr") {
      ui.approvalPrPage = page;
      renderApprovalList();
    }

    if (list === "approval-po") {
      ui.approvalPoPage = page;
      renderApprovalList();
    }

    if (list === "receive") {
      ui.receivePage = page;
      renderReceivePoList();
    }
  }

  if (action === "close-pr-detail") {
    ui.selectedPrDetailId = "";
    renderPrDetailPanel();
  }

  if (action === "view-po-source") {
    ui.selectedPoDetailPrId = id;
    renderPoDetailPanel();
    document.getElementById("po-detail-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (action === "close-po-detail") {
    ui.selectedPoDetailPrId = "";
    renderPoDetailPanel();
  }

  if (action === "open-receive-po") {
    ui.selectedReceivePoId = id;
    ui.receiveFormOpen = true;
    ui.receiveBasis = "quantity";
    document.getElementById("receive-form").reset();
    renderReceiveForm();
    document.getElementById("receive-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (action === "close-receive-form") {
    ui.selectedReceivePoId = "";
    ui.receiveFormOpen = false;
    ui.receiveBasis = "quantity";
    document.getElementById("receive-form").reset();
    renderReceiveForm();
  }

  if (action === "create-po-from-pr") {
    ui.selectedPoCreatePrId = id;
    ui.selectedPoDetailPrId = "";
    ui.poFormOpen = true;
    ui.poDraftItems = [];
    ui.poDraftApprovers = [];
    ui.editingPoApproverIndex = -1;
    ui.poDraftQuotations = [];
    ui.editingPoQuotationIndex = -1;
    document.getElementById("po-form").reset();
    renderApprovedPrOptions();
    loadPoDraftItemsFromSelectedPr();
    renderMasterReferenceOptions();
    renderPoForm();
    document.getElementById("po-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

    if (action === "approve-po") {
      approvePo(id);
    }

    if (action === "reject-po") {
      rejectPo(id);
    }

    if (action === "resend-approval-email") {
      resendApprovalEmail(type, id, Number(index));
    }

      if (action === "edit-company") {
        editCompany(id);
    }

    if (action === "toggle-company") {
      toggleCompany(id);
    }

    if (action === "view-company") {
      viewCompany(id);
    }

    if (action === "edit-user") {
      editUser(id);
    }

    if (action === "toggle-user") {
      toggleUser(id);
    }

    if (action === "view-user") {
      viewUser(id);
    }

    if (action === "edit-role-access") {
      ui.selectedRoleId = id;
      setActiveSection("role-management");
      renderRoleForm();
      document.getElementById("role-form").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (action === "edit-vendor") {
      editVendor(id);
    }

    if (action === "toggle-vendor") {
      toggleVendor(id);
    }

    if (action === "view-vendor") {
      viewVendor(id);
    }

    if (action === "edit-reference") {
      editReference(id);
    }

    if (action === "toggle-reference") {
      toggleReference(id);
    }

    if (action === "view-reference") {
      viewReference(id);
    }

    if (action === "open-reference-editor") {
      if (userHasRole("administrator")) {
        ui.selectedMasterCategoryId = id;
        ui.editingReferenceValueId = "";
        ui.referenceEditorOpen = true;
        renderMasterCategorySelect();
        renderReferenceForm();
        document.getElementById("reference-editor-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveSection(button.dataset.section);
    });
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveSection(button.dataset.jump);
    });
  });
}

function bindSessionControls() {
  document.getElementById("logout-button").addEventListener("click", logout);

  document.getElementById("company-switcher").addEventListener("change", (event) => {
    state.session.activeCompanyId = event.target.value;
    refreshAll();
  });

  document.getElementById("master-category-select").addEventListener("change", (event) => {
    ui.selectedMasterCategoryId = event.target.value;
    ui.editingReferenceValueId = "";
    renderReferenceForm();
  });

  document.getElementById("master-search-input").addEventListener("input", (event) => {
    ui.masterSearch = event.target.value;
    renderReferenceList();
  });

  document.getElementById("master-status-filter").addEventListener("change", (event) => {
    ui.masterStatusFilter = event.target.value;
    renderReferenceList();
  });

  document.getElementById("master-category-filter").addEventListener("change", (event) => {
    ui.masterCategoryFilter = event.target.value;
    renderReferenceList();
  });

  document.getElementById("master-filter-reset").addEventListener("click", () => {
    ui.masterSearch = "";
    ui.masterStatusFilter = "all";
    ui.masterCategoryFilter = "all";
    document.getElementById("master-search-input").value = "";
    document.getElementById("master-status-filter").value = "all";
    document.getElementById("master-category-filter").value = "all";
    renderReferenceList();
  });
}

function bindReceivePoSelection() {
  renderReceiveLines();
}

function init() {
  renderLoginCompanies();
  bindForms();
  bindActionButtons();
  bindNavigation();
  bindSessionControls();
  bindReceivePoSelection();
  refreshAll();
}

init();
