-- Run after connecting to erplittle:
-- psql -U postgres -d erplittle -f database/init/001_schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) UNIQUE NOT NULL,
  name varchar(160) NOT NULL,
  type varchar(80) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  is_default boolean NOT NULL DEFAULT false,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id varchar(80) PRIMARY KEY,
  name varchar(120) NOT NULL,
  modules text[] NOT NULL DEFAULT '{}',
  status varchar(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  email varchar(160) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_companies (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id varchar(80) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  code varchar(40) NOT NULL,
  name varchar(160) NOT NULL,
  contact_person varchar(120),
  email varchar(160),
  type varchar(80) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  address text,
  note text,
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS reference_categories (
  id varchar(80) PRIMARY KEY,
  name varchar(120) NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS reference_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id varchar(80) NOT NULL REFERENCES reference_categories(id) ON DELETE CASCADE,
  code varchar(40) NOT NULL,
  name varchar(120) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  UNIQUE (category_id, code)
);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  requester_id uuid REFERENCES users(id),
  document_number varchar(60) NOT NULL,
  title varchar(200) NOT NULL,
  short_description varchar(255) NOT NULL,
  description text,
  department varchar(120),
  priority varchar(80),
  status varchar(40) NOT NULL DEFAULT 'draft',
  total_amount numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document_number)
);

CREATE TABLE IF NOT EXISTS purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id uuid NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  code varchar(60) NOT NULL,
  name varchar(180) NOT NULL,
  quantity numeric(18,2) NOT NULL DEFAULT 1,
  unit_price numeric(18,2) NOT NULL DEFAULT 0,
  category varchar(80) NOT NULL,
  warehouse varchar(120)
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type varchar(10) NOT NULL,
  document_id uuid NOT NULL,
  approver_name varchar(160) NOT NULL,
  approver_position varchar(120) NOT NULL,
  approver_email varchar(160) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'waiting_response'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  purchase_request_id uuid NOT NULL REFERENCES purchase_requests(id),
  vendor_id uuid REFERENCES vendors(id),
  document_number varchar(60) NOT NULL,
  short_description varchar(255) NOT NULL,
  description text,
  status varchar(40) NOT NULL DEFAULT 'draft',
  tax_percent numeric(8,2) NOT NULL DEFAULT 0,
  net_amount numeric(18,2) NOT NULL DEFAULT 0,
  tax_amount numeric(18,2) NOT NULL DEFAULT 0,
  total_amount numeric(18,2) NOT NULL DEFAULT 0,
  UNIQUE (company_id, document_number)
);

CREATE TABLE IF NOT EXISTS purchase_order_purchase_requests (
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  purchase_request_id uuid NOT NULL REFERENCES purchase_requests(id),
  PRIMARY KEY (purchase_order_id, purchase_request_id)
);

CREATE INDEX IF NOT EXISTS idx_po_pr_purchase_request
  ON purchase_order_purchase_requests(purchase_request_id);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  code varchar(60) NOT NULL,
  name varchar(180) NOT NULL,
  quantity numeric(18,2) NOT NULL DEFAULT 1,
  unit_price numeric(18,2) NOT NULL DEFAULT 0,
  tax_percent numeric(8,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rfq_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id),
  vendor_name varchar(160) NOT NULL,
  attachment_name varchar(255),
  selected boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS receives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id),
  document_number varchar(60) NOT NULL,
  kind varchar(20) NOT NULL,
  basis varchar(20) NOT NULL,
  handover_document varchar(255)
);

CREATE TABLE IF NOT EXISTS receive_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receive_id uuid NOT NULL REFERENCES receives(id) ON DELETE CASCADE,
  code varchar(60) NOT NULL,
  name varchar(180) NOT NULL,
  received_quantity numeric(18,2) NOT NULL DEFAULT 0,
  received_amount numeric(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  document_number varchar(60) NOT NULL,
  source_type varchar(40) NOT NULL,
  source_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  coa_code varchar(40) NOT NULL,
  coa_name varchar(160) NOT NULL,
  debit numeric(18,2) NOT NULL DEFAULT 0,
  credit numeric(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pr_company_status ON purchase_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_po_company_status ON purchase_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_document ON approval_steps(document_type, document_id);
