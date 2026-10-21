import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type Company = {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  isDefault: boolean;
  address?: string;
};

export type Role = {
  id: string;
  name: string;
  modules: string[];
  status: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  companies: Company[];
  roles: Role[];
};

export type Vendor = {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  company: Company;
  address?: string;
};

export type PurchaseItem = {
  id?: string;
  code: string;
  name: string;
  quantity: string;
  unitPrice: string;
  category?: string;
  warehouse?: string;
  taxPercent?: string;
};

export type ApprovalDraft = {
  approverName: string;
  approverPosition: string;
  approverEmail: string;
};

export type PurchaseRequest = {
  id: string;
  documentNumber: string;
  title: string;
  description?: string;
  department?: string;
  priority?: string;
  status: string;
  totalAmount: string;
  company: Company;
  requester?: User;
  items: PurchaseItem[];
};

export type PurchaseOrder = {
  id: string;
  documentNumber: string;
  status: string;
  taxPercent: string;
  netAmount: string;
  taxAmount: string;
  totalAmount: string;
  company: Company;
  purchaseRequest: PurchaseRequest;
  vendor?: Vendor;
  items: PurchaseItem[];
  quotations?: Array<{ id?: string; vendorName: string; attachmentName?: string; selected: boolean }>;
  receivedLines?: Array<{ code: string; name: string; receivedQuantity: string; receivedAmount: string }>;
};

export type ApprovalRow = {
  id: string;
  documentType: "PR" | "PO";
  documentId: string;
  documentNumber: string;
  documentTitle?: string;
  documentStatus: string;
  approverName: string;
  approverPosition: string;
  approverEmail: string;
  status: string;
};

export type Receive = {
  id: string;
  documentNumber: string;
  kind: "goods" | "service" | "mixed";
  basis: "quantity" | "amount" | "deliverable";
  handoverDocument?: string;
  purchaseOrder: PurchaseOrder;
  lines: Array<{ id: string; code: string; name: string; receivedQuantity: string; receivedAmount: string }>;
};

export type Session = {
  accessToken: string;
  user: User;
  activeCompany: Company;
  companies: Company[];
};

export async function fetchLoginCompanies(email: string) {
  const { data } = await api.get<Company[]>("/auth/companies", { params: { email } });
  return data;
}

export async function login(email: string, password: string, companyId: string) {
  const { data } = await api.post<Session>("/auth/login", { email, password, companyId });
  localStorage.setItem("erp_access_token", data.accessToken);
  localStorage.setItem("erp_session", JSON.stringify(data));
  return data;
}

export function logout() {
  localStorage.removeItem("erp_access_token");
  localStorage.removeItem("erp_session");
}

export function storedSession() {
  const raw = localStorage.getItem("erp_session");
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function fetchCompanies() {
  const { data } = await api.get<Company[]>("/companies", { params: { includeInactive: true } });
  return data;
}

export async function saveCompany(payload: unknown, id?: string) {
  const { data } = id ? await api.patch<Company>(`/companies/${id}`, payload) : await api.post<Company>("/companies", payload);
  return data;
}

export async function deleteCompany(id: string) {
  const { data } = await api.delete<Company>(`/companies/${id}`);
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function saveUser(payload: unknown, id?: string) {
  const { data } = id ? await api.patch<User>(`/users/${id}`, payload) : await api.post<User>("/users", payload);
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await api.delete<User>(`/users/${id}`);
  return data;
}

export async function fetchRoles() {
  const { data } = await api.get<Role[]>("/roles");
  return data;
}

export async function saveRole(payload: unknown, id?: string) {
  const { data } = id ? await api.patch<Role>(`/roles/${id}`, payload) : await api.post<Role>("/roles", payload);
  return data;
}

export async function deleteRole(id: string) {
  const { data } = await api.delete<Role>(`/roles/${id}`);
  return data;
}

export async function fetchVendors(companyId?: string) {
  const { data } = await api.get<Vendor[]>("/vendors", { params: { companyId } });
  return data;
}

export async function saveVendor(payload: unknown, id?: string) {
  const { data } = id ? await api.patch<Vendor>(`/vendors/${id}`, payload) : await api.post<Vendor>("/vendors", payload);
  return data;
}

export async function deleteVendor(id: string) {
  const { data } = await api.delete<Vendor>(`/vendors/${id}`);
  return data;
}

export async function fetchPurchaseRequests(companyId?: string, search?: string) {
  const { data } = await api.get<PurchaseRequest[]>("/purchase-requests", { params: { companyId, search } });
  return data;
}

export async function savePurchaseRequest(payload: unknown, id?: string) {
  const { data } = id
    ? await api.patch<PurchaseRequest>(`/purchase-requests/${id}`, payload)
    : await api.post<PurchaseRequest>("/purchase-requests", payload);
  return data;
}

export async function cancelPurchaseRequest(id: string) {
  const { data } = await api.post<PurchaseRequest>(`/purchase-requests/${id}/cancel`);
  return data;
}

export async function fetchPurchaseOrders(companyId?: string, search?: string) {
  const { data } = await api.get<PurchaseOrder[]>("/purchase-orders", { params: { companyId, search } });
  return data;
}

export async function fetchEligiblePurchaseRequests() {
  const { data } = await api.get<PurchaseRequest[]>("/purchase-orders/eligible-purchase-requests");
  return data;
}

export async function createPurchaseOrder(payload: unknown) {
  const { data } = await api.post<PurchaseOrder>("/purchase-orders", payload);
  return data;
}

export async function cancelPurchaseOrder(id: string) {
  const { data } = await api.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`);
  return data;
}

export async function fetchApprovals(context?: "PR" | "PO") {
  const { data } = await api.get<ApprovalRow[]>("/approvals", { params: { context } });
  return data;
}

export async function approvalAction(id: string, action: "approved" | "rejected") {
  const { data } = await api.post(`/approvals/${id}/action`, { action });
  return data;
}

export async function resendApproval(id: string) {
  const { data } = await api.post(`/approvals/${id}/resend`);
  return data;
}

export async function fetchReceivablePurchaseOrders() {
  const { data } = await api.get<PurchaseOrder[]>("/receives/purchase-orders");
  return data;
}

export async function fetchReceives() {
  const { data } = await api.get<Receive[]>("/receives");
  return data;
}

export async function createReceive(payload: unknown) {
  const { data } = await api.post<Receive>("/receives", payload);
  return data;
}
