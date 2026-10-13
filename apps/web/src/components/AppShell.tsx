import { ReactNode } from "react";
import { Company, User } from "../lib/api";

export type MenuItem = {
  id: string;
  label: string;
  group: string;
  moduleKeys: string[];
};

export const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", group: "UMUM", moduleKeys: ["dashboard"] },
  { id: "purchase-request", label: "Permintaan Barang", group: "TRANSAKSI", moduleKeys: ["purchase-request"] },
  { id: "approval", label: "Persetujuan", group: "TRANSAKSI", moduleKeys: ["approval-queue"] },
  { id: "purchase-order", label: "Purchase Order", group: "TRANSAKSI", moduleKeys: ["purchase-order"] },
  { id: "receive", label: "Penerimaan", group: "TRANSAKSI", moduleKeys: ["receive"] },
  { id: "journal", label: "Jurnal Umum", group: "AKUNTANSI", moduleKeys: ["journal"] },
  { id: "company", label: "Data Usaha", group: "MASTER", moduleKeys: ["company-management", "master"] },
  { id: "users", label: "User Management", group: "MASTER", moduleKeys: ["user-management", "master"] },
  { id: "roles", label: "Roles Management", group: "MASTER", moduleKeys: ["role-management", "master"] },
  { id: "vendors", label: "Master Vendor", group: "MASTER", moduleKeys: ["master-vendor", "master"] }
];

type AppShellProps = {
  activePage: string;
  allowedMenu: MenuItem[];
  activeCompany: Company;
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({ activePage, allowedMenu, activeCompany, user, onNavigate, onLogout, children }: AppShellProps) {
  const groups = [...new Set(allowedMenu.map((item) => item.group))];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="brand-title">ERP [ Procure ]</p>
          <p className="brand-subtitle">{activeCompany.name}</p>
        </div>
        <nav className="nav">
          {groups.map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-title">{group}</p>
              {allowedMenu
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
            <p className="topbar-breadcrumb">ERP [ Procure ] / {activeCompany.code}</p>
            <h1>{menuItems.find((item) => item.id === activePage)?.label || "Dashboard"}</h1>
            <p className="topbar-subtitle">Workflow PR, PO, approval, dan receiving berdasarkan role login.</p>
          </div>
          <div className="user-card">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <div className="chip-row">
              <span className="soft-pill compact">{activeCompany.name}</span>
              <button className="danger-button small" onClick={onLogout} type="button">
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
