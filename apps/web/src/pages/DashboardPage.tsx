import { Company, PurchaseRequest, User, Vendor } from "../lib/api";

type DashboardPageProps = {
  companies: Company[];
  users: User[];
  vendors: Vendor[];
  purchaseRequests: PurchaseRequest[];
};

export function DashboardPage({ companies, users, vendors, purchaseRequests }: DashboardPageProps) {
  return (
    <div className="page-stack">
      <section className="stats">
        <article className="stat-card">
          <span>Total Company</span>
          <strong>{companies.length}</strong>
          <p>Scope login multi-company</p>
        </article>
        <article className="stat-card warm">
          <span>User Login</span>
          <strong>{users.length}</strong>
          <p>Assignment company dan role</p>
        </article>
        <article className="stat-card green">
          <span>Vendor</span>
          <strong>{vendors.length}</strong>
          <p>Master vendor per company</p>
        </article>
        <article className="stat-card red">
          <span>Purchase Request</span>
          <strong>{purchaseRequests.length}</strong>
          <p>Data dari backend API</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Relasi PR dan PO</h2>
            <p>Area ini akan menjadi dashboard relasi PR, PO, receive, dan jurnal setelah workflow API selesai.</p>
          </div>
          <span className="soft-pill">React + NestJS</span>
        </div>
        <div className="table">
          <div className="table-head dashboard-grid">
            <span>Nomor PR</span>
            <span>Company</span>
            <span>Status PR</span>
            <span>Nilai</span>
          </div>
          {purchaseRequests.length ? (
            purchaseRequests.map((pr) => (
              <div className="table-row dashboard-grid" key={pr.id}>
                <strong>{pr.documentNumber}</strong>
                <span>{pr.company?.name}</span>
                <span>{pr.status}</span>
                <span>Rp {Number(pr.totalAmount).toLocaleString("id-ID")}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">Belum ada data PR di database.</div>
          )}
        </div>
      </section>
    </div>
  );
}
