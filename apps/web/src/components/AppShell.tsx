import { ReactNode } from "react";

type MenuItem = {
  id: string;
  label: string;
  group: string;
};

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", group: "UMUM" },
  { id: "purchase-request", label: "Permintaan Barang", group: "TRANSAKSI" },
  { id: "approval", label: "Persetujuan", group: "TRANSAKSI" },
  { id: "purchase-order", label: "Pesanan Pembelian", group: "TRANSAKSI" },
  { id: "receive", label: "Penerimaan Barang", group: "TRANSAKSI" },
  { id: "journal", label: "Jurnal Umum", group: "AKUNTANSI" },
  { id: "company", label: "Data Usaha", group: "MASTER" },
  { id: "users", label: "User Management", group: "MASTER" },
  { id: "roles", label: "Roles Management", group: "MASTER" },
  { id: "vendors", label: "Master Vendor", group: "MASTER" },
  { id: "reference", label: "Master Referensi", group: "MASTER" }
];

type AppShellProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
};

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  const groups = [...new Set(menuItems.map((item) => item.group))];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="brand-title">ERP [ Procure ]</p>
          <p className="brand-subtitle">PostgreSQL: erplittle</p>
        </div>
        <nav className="nav">
          {groups.map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-title">{group}</p>
              {menuItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    className={`nav-link ${activePage === item.id ? "active" : ""}`}
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="app-topbar">
          <div>
            <p className="topbar-breadcrumb">ERP Kecil / React + NestJS</p>
            <h1>{menuItems.find((item) => item.id === activePage)?.label || "Dashboard"}</h1>
            <p className="topbar-subtitle">Migrasi MVP dari localStorage ke API dan PostgreSQL.</p>
          </div>
          <span className="topbar-pill">appskecil.kcsi-id.com ready</span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
