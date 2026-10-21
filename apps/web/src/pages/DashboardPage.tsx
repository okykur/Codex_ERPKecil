import { Company, PurchaseOrder, PurchaseRequest, Receive, User, Vendor } from "../lib/api";

type DashboardPageProps = {
  activeCompany: Company;
  allowedPageIds: string[];
  assignedCompanies: Company[];
  companies: Company[];
  isAdmin: boolean;
  users: User[];
  vendors: Vendor[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  receives: Receive[];
};

export function DashboardPage({
  activeCompany,
  allowedPageIds,
  assignedCompanies,
  companies,
  isAdmin,
  users,
  vendors,
  purchaseRequests,
  purchaseOrders,
  receives
}: DashboardPageProps) {
  const allowedPages = new Set(allowedPageIds);
  const canSee = (pageId: string) => isAdmin || allowedPages.has(pageId);
  const companyCount = isAdmin ? companies.length : assignedCompanies.filter((company) => company.status === "active").length;
  const userCount = isAdmin
    ? users.length
    : users.filter((user) => user.companies.some((company) => company.id === activeCompany.id)).length;
  const cards = [
    { pageId: "company", label: "Total Company", value: companyCount, note: isAdmin ? "Seluruh Data Usaha" : "Sesuai assignment user", tone: "" },
    { pageId: "users", label: "User Login", value: userCount, note: isAdmin ? "Seluruh user terdaftar" : `User di ${activeCompany.name}`, tone: "warm" },
    { pageId: "vendors", label: "Vendor", value: vendors.length, note: `Vendor di ${activeCompany.name}`, tone: "green" },
    { pageId: "purchase-request", label: "Purchase Request", value: purchaseRequests.length, note: `PR di ${activeCompany.name}`, tone: "red" },
    { pageId: "purchase-order", label: "Purchase Order", value: purchaseOrders.length, note: `PO di ${activeCompany.name}`, tone: "" },
    { pageId: "receive", label: "Receive", value: receives.length, note: `Penerimaan di ${activeCompany.name}`, tone: "green" }
  ].filter((card) => canSee(card.pageId));
  const canViewPr = canSee("purchase-request");
  const canViewPo = canSee("purchase-order");
  const canViewReceive = canSee("receive");
  const showTransactionRelation = canViewPr || canViewPo || canViewReceive;
  const relationGridStyle = {
    gridTemplateColumns: [
      canViewPr ? "minmax(180px, 1.2fr)" : "",
      "minmax(180px, 1.3fr)",
      canViewPo ? "minmax(180px, 1.2fr)" : "",
      canViewPr || canViewPo ? "minmax(220px, 1.4fr)" : "",
      canViewReceive ? "minmax(190px, 1.2fr)" : ""
    ].filter(Boolean).join(" ")
  };

  return (
    <div className="page-stack">
      <section className="stats">
        {cards.map((card) => (
          <article className={`stat-card ${card.tone}`.trim()} key={card.pageId}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      {showTransactionRelation ? <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Relasi PR dan PO</h2>
            <p>Data transaksi mengikuti akses role dan PT aktif.</p>
          </div>
        </div>
        <div className="table dashboard-relation-table">
          <div className="table-head" style={relationGridStyle}>
            {canViewPr ? <span>Nomor PR</span> : null}
            <span>Company</span>
            {canViewPo ? <span>Nomor PO</span> : null}
            {canViewPr || canViewPo ? <span>Status PR/PO</span> : null}
            {canViewReceive ? <span>Nomor Receive</span> : null}
          </div>
          {purchaseRequests.length ? (
            purchaseRequests.map((pr) => {
              const relatedPo = purchaseOrders.find((po) => po.purchaseRequest?.id === pr.id);
              const relatedReceives = relatedPo
                ? receives.filter((receive) => receive.purchaseOrder?.id === relatedPo.id)
                : [];
              return (
              <div className="table-row" key={pr.id} style={relationGridStyle}>
                {canViewPr ? <strong>{pr.documentNumber}</strong> : null}
                <span>{pr.company?.name}</span>
                {canViewPo ? <span>{relatedPo?.documentNumber || "-"}</span> : null}
                {canViewPr || canViewPo ? (
                  <span>{[canViewPr ? `PR: ${pr.status}` : "", canViewPo ? `PO: ${relatedPo?.status || "-"}` : ""].filter(Boolean).join(" / ")}</span>
                ) : null}
                {canViewReceive ? (
                  <span className="receive-number-cell">
                    {relatedReceives.map((receive) => receive.documentNumber).join(", ") || "-"}
                  </span>
                ) : null}
              </div>
              );
            })
          ) : (
            <div className="empty-state">Belum ada data transaksi untuk PT aktif.</div>
          )}
        </div>
      </section> : null}
    </div>
  );
}
