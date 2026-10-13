-- Development seed. User rows are created with disabled password placeholders.
-- Set real bcrypt hashes through a secure admin process before enabling login.
INSERT INTO companies (id, code, name, type, status, is_default, address) VALUES
  ('10000000-0000-0000-0000-000000000001', 'CMP-HO', 'PT Kecil HO', 'Operasional', 'active', true, 'Jl. Jenderal Sudirman No. 88, Jakarta Pusat'),
  ('10000000-0000-0000-0000-000000000002', 'CMP-TRD', 'PT Kecil Trading', 'Trading', 'active', false, 'Kawasan Industri MM2100 Blok C2, Bekasi'),
  ('10000000-0000-0000-0000-000000000003', 'CMP-SVC', 'PT Kecil Services', 'Services', 'active', false, 'Jl. Veteran No. 15, Surabaya'),
  ('10000000-0000-0000-0000-000000000004', 'CMP-PRJ', 'PT Kecil Project A', 'Project', 'inactive', false, 'Jl. Soekarno Hatta KM 12, Bandung')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, name, modules, status) VALUES
  ('user_maker', 'User Maker', ARRAY['dashboard','purchase-request','approval-queue'], 'active'),
  ('procurement', 'Procurement', ARRAY['dashboard','purchase-request','approval-queue','purchase-order','receive','journal'], 'active'),
  ('administrator', 'Administrator', ARRAY['dashboard','company-management','user-management','role-management','master-vendor','master','purchase-request','approval-queue','purchase-order','receive','journal'], 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, modules = EXCLUDED.modules, status = EXCLUDED.status;

INSERT INTO users (id, name, email, password_hash, status) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Administrator ERP', 'administrator@ptkecil.co.id', 'DISABLED_SET_BCRYPT_HASH', 'inactive'),
  ('20000000-0000-0000-0000-000000000002', 'Mira Andini', 'maker.ho@ptkecil.co.id', 'DISABLED_SET_BCRYPT_HASH', 'inactive'),
  ('20000000-0000-0000-0000-000000000003', 'Rudi Hartono', 'procurement@ptkecil.co.id', 'DISABLED_SET_BCRYPT_HASH', 'inactive')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_companies (user_id, company_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
  ('20000000-0000-0000-0000-000000000001', 'administrator'),
  ('20000000-0000-0000-0000-000000000002', 'user_maker'),
  ('20000000-0000-0000-0000-000000000003', 'procurement')
ON CONFLICT DO NOTHING;

INSERT INTO vendors (company_id, code, name, contact_person, email, type, status, address, note) VALUES
  ('10000000-0000-0000-0000-000000000001', 'VND-001', 'PT Solusi Digital Nusantara', 'Ayu Lestari', 'sales@sdn.co.id', 'Barang IT', 'active', 'Jl. Gatot Subroto Kav. 12, Jakarta Selatan', 'Vendor utama perangkat IT'),
  ('10000000-0000-0000-0000-000000000001', 'VND-002', 'CV Alpha Teknologi', 'Bagus Pratama', 'hello@alphatek.id', 'Barang / Jasa', 'active', 'Ruko Tekno Park Blok B7, Tangerang Selatan', 'Alternatif vendor procurement umum')
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO reference_categories (id, name, description) VALUES
  ('request_type', 'Jenis Permintaan', 'Jenis permintaan untuk Purchase Request'),
  ('priority', 'Prioritas Permintaan', 'Urgensi permintaan dalam workflow approval')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO reference_values (category_id, code, name, status) VALUES
  ('request_type', 'JNS-01', 'Pengadaan Barang', 'active'),
  ('request_type', 'JNS-02', 'Pengadaan Jasa', 'active'),
  ('priority', 'PRI-01', 'Normal', 'active'),
  ('priority', 'PRI-02', 'Tinggi', 'active')
ON CONFLICT (category_id, code) DO NOTHING;
