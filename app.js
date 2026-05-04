const STORAGE_KEY = "erp-pt-kecil-v1";
const FINAL_APPROVAL_THRESHOLD = 50000000;
const PO_APPROVAL_THRESHOLD = 75000000;

const coaMaster = [
  { code: "1101", name: "Persediaan Barang", kind: "non_asset" },
  { code: "1501", name: "Peralatan Kantor", kind: "asset" },
  { code: "1502", name: "Perangkat IT", kind: "asset" },
  { code: "5101", name: "Beban Alat Tulis Kantor", kind: "non_asset" },
  { code: "5204", name: "Beban Operasional Umum", kind: "non_asset" },
  { code: "2105", name: "GR/IR Clearing", kind: "liability" },
  { code: "2001", name: "Accounts Payable", kind: "liability" }
];

const seedState = {
  counters: { pr: 3, po: 2, rcv: 2, journal: 2 },
  purchaseRequests: [
    {
      id: "PR-0001",
      title: "Pengadaan laptop tim finance",
      requester: "Nadia",
      department: "Finance",
      costCenter: "FIN-001",
      amount: 38000000,
      vendorSuggestion: "CV Alpha Teknologi",
      category: "asset",
      coaCode: "1502",
      description: "2 unit laptop untuk closing dan rekonsiliasi bulanan.",
      status: "approved",
      approvalStage: "done",
      createdAt: "2026-04-28T10:00:00+07:00",
      history: [
        "Submitted oleh Nadia",
        "Approved Dept Head",
        "Approved final"
      ]
    },
    {
      id: "PR-0002",
      title: "ATK bulanan operasional",
      requester: "Rizal",
      department: "GA",
      costCenter: "GA-002",
      amount: 6500000,
      vendorSuggestion: "Toko Sinar Kantor",
      category: "non_asset",
      coaCode: "5101",
      description: "Kertas, tinta printer, dan alat tulis kantor.",
      status: "approved",
      approvalStage: "done",
      createdAt: "2026-04-29T09:30:00+07:00",
      history: [
        "Submitted oleh Rizal",
        "Approved Dept Head"
      ]
    }
  ],
  purchaseOrders: [
    {
      id: "PO-0001",
      prId: "PR-0001",
      vendorName: "PT Solusi Digital Nusantara",
      paymentTerm: "30 hari",
      needBy: "2026-05-10",
      amount: 38000000,
      status: "issued",
      createdAt: "2026-04-29T14:15:00+07:00",
      history: ["PO dibuat procurement", "PO issued ke vendor"]
    }
  ],
  receipts: [
    {
      id: "RCV-0001",
      poId: "PO-0001",
      prId: "PR-0001",
      receiver: "Bimo",
      receiveType: "asset",
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
      sourceId: "RCV-0001",
      createdAt: "2026-04-30T11:00:00+07:00",
      lines: [
        { account: "1502 - Perangkat IT", type: "Debit", amount: 38000000 },
        { account: "2105 - GR/IR Clearing", type: "Credit", amount: 38000000 }
      ]
    }
  ]
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(seedState);
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

function nextId(prefix, key) {
  state.counters[key] += 1;
  return `${prefix}-${String(state.counters[key]).padStart(4, "0")}`;
}

function getCoaByCode(code) {
  return coaMaster.find((item) => item.code === code);
}

function getPrById(id) {
  return state.purchaseRequests.find((item) => item.id === id);
}

function getPoById(id) {
  return state.purchaseOrders.find((item) => item.id === id);
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

function prStatusBadge(status) {
  const map = {
    submitted: "Menunggu Dept Head",
    waiting_finance: "Menunggu Finance",
    approved: "Approved",
    rejected: "Rejected"
  };
  return map[status] || status;
}

function renderNavigation() {
  const buttons = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.section;
      buttons.forEach((item) => item.classList.toggle("active", item === button));
      sections.forEach((section) => section.classList.toggle("active", section.id === target));
    });
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.jump;
      document.querySelector(`.nav-link[data-section="${target}"]`).click();
    });
  });
}

function renderStats() {
  const cards = [
    {
      title: "Open PR",
      value: state.purchaseRequests.filter((item) => ["submitted", "waiting_finance"].includes(item.status)).length,
      note: "Pengajuan yang masih menunggu approval"
    },
    {
      title: "Approved PR",
      value: state.purchaseRequests.filter((item) => item.status === "approved").length,
      note: "Siap diproses menjadi PO"
    },
    {
      title: "Open PO",
      value: state.purchaseOrders.filter((item) => ["waiting_approval", "issued"].includes(item.status)).length,
      note: "PO aktif menunggu kirim atau receive"
    },
    {
      title: "Jurnal Receive",
      value: state.journals.length,
      note: "Posting otomatis dari transaksi receive"
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

function renderTimeline() {
  const steps = [
    "Requester membuat PR, memilih COA, cost center, dan kategori asset/non-asset.",
    "Dept Head meninjau justifikasi dan nominal pengajuan.",
    "Finance atau direktur memberi approval final jika nilai PR melewati threshold.",
    "Procurement membuat PO dari PR approved dan memilih vendor final.",
    "Goods receive memicu pencatatan asset register atau expense/inventory serta jurnal COA."
  ];

  document.getElementById("timeline").innerHTML = steps
    .map((text, index) => `<li><span>${index + 1}</span>${text}</li>`)
    .join("");
}

function recentActivityItems() {
  const prItems = state.purchaseRequests.map((item) => ({
    when: item.createdAt,
    title: `${item.id} dibuat`,
    detail: `${item.requester} mengajukan ${item.title}`
  }));
  const poItems = state.purchaseOrders.map((item) => ({
    when: item.createdAt,
    title: `${item.id} dibuat`,
    detail: `PO untuk ${item.prId} dikirim ke ${item.vendorName}`
  }));
  const receiveItems = state.receipts.map((item) => ({
    when: item.createdAt,
    title: `${item.id} diterima`,
    detail: `Receive ${item.receiveType === "asset" ? "asset" : "non-asset"} untuk ${item.poId}`
  }));

  return [...prItems, ...poItems, ...receiveItems]
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, 6);
}

function renderRecentActivity() {
  const container = document.getElementById("recent-activity");
  const items = recentActivityItems();

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">Belum ada aktivitas.</div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <header>
            <h4>${item.title}</h4>
            <span class="pill soft">${formatDate(item.when)}</span>
          </header>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderCoaOptions() {
  const select = document.getElementById("coa-select");
  select.innerHTML = coaMaster
    .filter((item) => item.kind !== "liability")
    .map((item) => `<option value="${item.code}">${item.code} - ${item.name}</option>`)
    .join("");
}

function renderPrList() {
  const container = document.getElementById("pr-list");

  if (!state.purchaseRequests.length) {
    container.innerHTML = `<div class="empty-state">Belum ada PR.</div>`;
    return;
  }

  container.innerHTML = state.purchaseRequests
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((pr) => {
      const coa = getCoaByCode(pr.coaCode);
      return `
        <article class="stack-item">
          <header>
            <div>
              <h4>${pr.id} · ${pr.title}</h4>
              <p>${pr.requester} · ${pr.department} · ${formatDate(pr.createdAt)}</p>
            </div>
            <span class="pill ${pr.status === "approved" ? "soft" : ""}">${prStatusBadge(pr.status)}</span>
          </header>
          <p>${pr.description}</p>
          <div class="inline-tags">
            <span class="tag">${currency(pr.amount)}</span>
            <span class="tag">${pr.category === "asset" ? "Asset" : "Non-Asset"}</span>
            <span class="tag">${coa.code} - ${coa.name}</span>
            <span class="tag">${pr.costCenter}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderApprovalList() {
  const container = document.getElementById("approval-list");
  const pending = state.purchaseRequests.filter((item) => ["submitted", "waiting_finance"].includes(item.status));

  if (!pending.length) {
    container.innerHTML = `<div class="empty-state">Tidak ada dokumen yang menunggu approval.</div>`;
    return;
  }

  container.innerHTML = pending
    .map(
      (pr) => `
        <article class="stack-item">
          <header>
            <div>
              <h4>${pr.id} · ${pr.title}</h4>
              <p>${pr.requester} · ${currency(pr.amount)} · ${pendingApprover(pr)}</p>
            </div>
            <span class="pill">${prStatusBadge(pr.status)}</span>
          </header>
          <p>${pr.description}</p>
          <div class="inline-tags">
            <span class="tag">${pr.category === "asset" ? "Asset" : "Non-Asset"}</span>
            <span class="tag">${pr.costCenter}</span>
            <span class="tag">${getCoaByCode(pr.coaCode).name}</span>
          </div>
          <footer class="stack-actions">
            <button class="mini-button primary" data-action="approve-pr" data-id="${pr.id}">Approve</button>
            <button class="mini-button danger" data-action="reject-pr" data-id="${pr.id}">Reject</button>
          </footer>
        </article>
      `
    )
    .join("");
}

function renderApprovedPrOptions() {
  const select = document.getElementById("approved-pr-select");
  const alreadyUsed = new Set(state.purchaseOrders.map((item) => item.prId));
  const approved = state.purchaseRequests.filter((item) => item.status === "approved" && !alreadyUsed.has(item.id));

  select.innerHTML = approved.length
    ? approved.map((pr) => `<option value="${pr.id}">${pr.id} · ${pr.title} · ${currency(pr.amount)}</option>`).join("")
    : `<option value="">Belum ada PR approved yang belum dibuatkan PO</option>`;
}

function renderPoList() {
  const container = document.getElementById("po-list");

  if (!state.purchaseOrders.length) {
    container.innerHTML = `<div class="empty-state">Belum ada PO.</div>`;
    return;
  }

  container.innerHTML = state.purchaseOrders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((po) => {
      const pr = getPrById(po.prId);
      const statusLabel = po.status === "waiting_approval" ? "Menunggu approval" : "Issued";
      return `
        <article class="stack-item">
          <header>
            <div>
              <h4>${po.id} · ${po.vendorName}</h4>
              <p>${po.prId} · Need by ${po.needBy} · ${formatDate(po.createdAt)}</p>
            </div>
            <span class="pill ${po.status === "issued" ? "soft" : ""}">${statusLabel}</span>
          </header>
          <p>${pr ? pr.title : "PR tidak ditemukan"}</p>
          <div class="inline-tags">
            <span class="tag">${currency(po.amount)}</span>
            <span class="tag">${po.paymentTerm}</span>
            <span class="tag">${pr?.category === "asset" ? "Asset" : "Non-Asset"}</span>
          </div>
          ${
            po.status === "waiting_approval"
              ? `<footer class="stack-actions">
                  <button class="mini-button primary" data-action="approve-po" data-id="${po.id}">Approve PO</button>
                </footer>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderIssuedPoOptions() {
  const select = document.getElementById("issued-po-select");
  const usedPo = new Set(state.receipts.map((item) => item.poId));
  const issued = state.purchaseOrders.filter((item) => item.status === "issued" && !usedPo.has(item.id));

  select.innerHTML = issued.length
    ? issued.map((po) => `<option value="${po.id}">${po.id} · ${po.vendorName} · ${currency(po.amount)}</option>`).join("")
    : `<option value="">Belum ada PO issued yang siap receive</option>`;
}

function renderReceiveList() {
  const container = document.getElementById("receive-list");

  if (!state.receipts.length) {
    container.innerHTML = `<div class="empty-state">Belum ada transaksi receive.</div>`;
    return;
  }

  container.innerHTML = state.receipts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((receipt) => `
      <article class="stack-item">
        <header>
          <div>
            <h4>${receipt.id} · ${receipt.poId}</h4>
            <p>${receipt.receiver} · ${formatDate(receipt.createdAt)}</p>
          </div>
          <span class="pill soft">${receipt.receiveType === "asset" ? "Asset Receive" : "Non-Asset Receive"}</span>
        </header>
        <p>${receipt.note}</p>
        <div class="inline-tags">
          <span class="tag">${currency(receipt.amount)}</span>
          <span class="tag">${receipt.documentRef}</span>
          ${
            receipt.assetNumber
              ? `<span class="tag">Register ${receipt.assetNumber}</span>`
              : `<span class="tag">Posted ke expense/inventory</span>`
          }
        </div>
      </article>
    `)
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

  if (!state.journals.length) {
    container.innerHTML = `<div class="empty-state">Belum ada jurnal otomatis.</div>`;
    return;
  }

  container.innerHTML = state.journals
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((journal) => `
      <article class="stack-item">
        <header>
          <div>
            <h4>${journal.id} · Source ${journal.sourceId}</h4>
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
    `)
    .join("");
}

function refreshAll() {
  saveState();
  renderStats();
  renderTimeline();
  renderRecentActivity();
  renderPrList();
  renderApprovalList();
  renderApprovedPrOptions();
  renderPoList();
  renderIssuedPoOptions();
  renderReceiveList();
  renderCoaList();
  renderJournalList();
}

function submitPr(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const pr = {
    id: nextId("PR", "pr"),
    title: formData.get("title"),
    requester: formData.get("requester"),
    department: formData.get("department"),
    costCenter: formData.get("costCenter"),
    amount: Number(formData.get("amount")),
    vendorSuggestion: formData.get("vendorSuggestion"),
    category: formData.get("category"),
    coaCode: formData.get("coaCode"),
    description: formData.get("description"),
    status: "submitted",
    approvalStage: "dept_head",
    createdAt: new Date().toISOString(),
    history: ["Submitted oleh requester"]
  };

  state.purchaseRequests.push(pr);
  event.target.reset();
  refreshAll();
}

function approvePr(id) {
  const pr = getPrById(id);
  if (!pr) {
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
  if (!pr) {
    return;
  }

  pr.status = "rejected";
  pr.approvalStage = "done";
  pr.history.push("Rejected");
  refreshAll();
}

function submitPo(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const prId = formData.get("prId");
  const pr = getPrById(prId);

  if (!pr) {
    return;
  }

  const status = pr.amount > PO_APPROVAL_THRESHOLD ? "waiting_approval" : "issued";
  const po = {
    id: nextId("PO", "po"),
    prId,
    vendorName: formData.get("vendorName"),
    paymentTerm: formData.get("paymentTerm"),
    needBy: formData.get("needBy"),
    amount: pr.amount,
    status,
    createdAt: new Date().toISOString(),
    history: [
      "PO dibuat dari PR approved",
      status === "issued" ? "PO issued ke vendor" : "PO menunggu approval tambahan"
    ]
  };

  state.purchaseOrders.push(po);
  event.target.reset();
  refreshAll();
}

function approvePo(id) {
  const po = getPoById(id);
  if (!po) {
    return;
  }

  po.status = "issued";
  po.history.push("PO approved dan issued ke vendor");
  refreshAll();
}

function submitReceive(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const poId = formData.get("poId");
  const po = getPoById(poId);
  const pr = po ? getPrById(po.prId) : null;

  if (!po || !pr) {
    return;
  }

  const receiveType = formData.get("receiveType");
  const receiptId = nextId("RCV", "rcv");
  const journalId = nextId("JRN", "journal");
  const coa = getCoaByCode(pr.coaCode);
  const amount = po.amount;
  const createdAt = new Date().toISOString();

  const receipt = {
    id: receiptId,
    poId,
    prId: pr.id,
    receiver: formData.get("receiver"),
    receiveType,
    documentRef: formData.get("documentRef"),
    note: formData.get("note"),
    amount,
    createdAt,
    assetNumber: receiveType === "asset" ? `AST-${new Date().getFullYear()}-${String(state.receipts.length + 1).padStart(4, "0")}` : ""
  };

  const debitAccount =
    receiveType === "asset"
      ? `${coa.code} - ${coa.name}`
      : `${coa.code} - ${coa.name}`;

  const journal = {
    id: journalId,
    sourceId: receiptId,
    createdAt,
    lines: [
      {
        account: debitAccount,
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
  po.status = "received";
  po.history.push("PO sudah di-receive");
  event.target.reset();
  refreshAll();
}

function bindForms() {
  document.getElementById("pr-form").addEventListener("submit", submitPr);
  document.getElementById("po-form").addEventListener("submit", submitPo);
  document.getElementById("receive-form").addEventListener("submit", submitReceive);
}

function bindActionButtons() {
  document.body.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    const id = event.target.dataset.id;

    if (action === "approve-pr") {
      approvePr(id);
    }

    if (action === "reject-pr") {
      rejectPr(id);
    }

    if (action === "approve-po") {
      approvePo(id);
    }
  });
}

function syncReceiveTypeWithPo() {
  const poSelect = document.getElementById("issued-po-select");
  const receiveType = document.querySelector('select[name="receiveType"]');

  poSelect.addEventListener("change", () => {
    const po = getPoById(poSelect.value);
    const pr = po ? getPrById(po.prId) : null;
    if (pr) {
      receiveType.value = pr.category;
    }
  });
}

function init() {
  renderNavigation();
  renderCoaOptions();
  bindForms();
  bindActionButtons();
  syncReceiveTypeWithPo();
  refreshAll();
}

init();
