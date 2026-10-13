import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000
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

export type PurchaseRequest = {
  id: string;
  documentNumber: string;
  title: string;
  department?: string;
  priority?: string;
  status: string;
  totalAmount: string;
  company: Company;
  requester?: User;
  items: Array<{
    id: string;
    code: string;
    name: string;
    quantity: string;
    unitPrice: string;
    category: string;
  }>;
};

export async function fetchCompanies() {
  const { data } = await api.get<Company[]>("/companies", { params: { includeInactive: true } });
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function fetchVendors(companyId?: string) {
  const { data } = await api.get<Vendor[]>("/vendors", { params: { companyId } });
  return data;
}

export async function fetchPurchaseRequests(companyId?: string, search?: string) {
  const { data } = await api.get<PurchaseRequest[]>("/purchase-requests", { params: { companyId, search } });
  return data;
}
