import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import {
  Company,
  PurchaseRequest,
  User,
  Vendor,
  fetchCompanies,
  fetchPurchaseRequests,
  fetchUsers,
  fetchVendors
} from "./lib/api";
import { DashboardPage } from "./pages/DashboardPage";
import { SimpleListPage } from "./pages/SimpleListPage";

export function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [companyData, userData, vendorData, prData] = await Promise.all([
          fetchCompanies(),
          fetchUsers(),
          fetchVendors(),
          fetchPurchaseRequests()
        ]);
        setCompanies(companyData);
        setUsers(userData);
        setVendors(vendorData);
        setPurchaseRequests(prData);
        setError("");
      } catch (loadError) {
        setError("API belum aktif atau database belum tersedia. Jalankan backend NestJS dan PostgreSQL erplittle.");
      }
    }

    void loadData();
  }, []);

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {error ? <div className="alert">{error}</div> : null}
      {activePage === "dashboard" ? (
        <DashboardPage companies={companies} users={users} vendors={vendors} purchaseRequests={purchaseRequests} />
      ) : null}
      {activePage === "company" ? (
        <SimpleListPage
          title="Master Company"
          description="Data usaha yang dipakai dari login sampai proses receive."
          rows={companies}
          getKey={(row) => row.id}
          columns={[
            { header: "Kode", render: (row) => row.code },
            { header: "Nama Company", render: (row) => row.name },
            { header: "Tipe", render: (row) => row.type },
            { header: "Status", render: (row) => row.status }
          ]}
        />
      ) : null}
      {activePage === "users" ? (
        <SimpleListPage
          title="User Management"
          description="Maintain user login, assignment company, dan role."
          rows={users}
          getKey={(row) => row.id}
          columns={[
            { header: "Nama", render: (row) => row.name },
            { header: "Email", render: (row) => row.email },
            { header: "Company", render: (row) => row.companies.map((company) => company.name).join(", ") },
            { header: "Role", render: (row) => row.roles.map((role) => role.name).join(", ") }
          ]}
        />
      ) : null}
      {activePage === "vendors" ? (
        <SimpleListPage
          title="Master Vendor"
          description="Vendor per company dengan alamat detail."
          rows={vendors}
          getKey={(row) => row.id}
          columns={[
            { header: "Kode", render: (row) => row.code },
            { header: "Nama Vendor", render: (row) => row.name },
            { header: "Company", render: (row) => row.company?.name },
            { header: "Status", render: (row) => row.status }
          ]}
        />
      ) : null}
      {activePage === "purchase-request" ? (
        <SimpleListPage
          title="Purchase Request"
          description="Daftar PR dari PostgreSQL. Create/update akan dimigrasikan pada tahap workflow berikutnya."
          rows={purchaseRequests}
          getKey={(row) => row.id}
          columns={[
            { header: "Nomor PR", render: (row) => row.documentNumber },
            { header: "Company", render: (row) => row.company?.name },
            { header: "Judul", render: (row) => row.title },
            { header: "Status", render: (row) => row.status },
            { header: "Nilai", render: (row) => `Rp ${Number(row.totalAmount).toLocaleString("id-ID")}` }
          ]}
        />
      ) : null}
      {!["dashboard", "company", "users", "vendors", "purchase-request"].includes(activePage) ? (
        <section className="panel">
          <h2>Modul Dalam Migrasi</h2>
          <p>
            Struktur menu sudah siap di React. Endpoint NestJS untuk modul ini akan dilanjutkan setelah fondasi
            PostgreSQL stabil.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
