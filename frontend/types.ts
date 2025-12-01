// --- ENUMS (ENUMERAÇÕES) ---
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  TECHNICIAN = 'TECHNICIAN'
}

export enum OSStatus {
  PENDING = 'Pendente',
  QUOTATION = 'Em Orçamento',
  APPROVED = 'Aprovado',
  IN_PROGRESS = 'Em Execução',
  COMPLETED = 'Concluído',
  CANCELED = 'Cancelado'
}

export enum ItemType {
  PART = 'PART',
  LABOR = 'LABOR'
}

// --- INTERFACES ---

export interface User {
  id: number; // Backend uses int
  name: string;
  email: string;
  role: UserRole;
  clientId?: number;
}

export interface Client {
  id: number;
  name: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  type?: string;
}

export interface Marina {
  id: number;
  name: string;
  address?: string;
  contactName?: string;
  phone?: string;
  coordinates?: string;
  operatingHours?: string;
}

export interface Engine {
  id: number;
  serialNumber: string;
  model: string;
  hours: number;
  year?: number;
  boatId: number;
}

export interface Boat {
  id: number;
  clientId: number;
  marinaId?: number;
  name: string;
  hullId: string;
  usageType?: string;
  model?: string;
  engines?: Engine[];
}

export interface EngineCreate {
  serialNumber: string;
  model: string;
  hours: number;
  year?: number;
}

export interface EngineUpdate {
  id?: number;
  serialNumber?: string;
  model?: string;
  hours?: number;
  year?: number;
}

export interface BoatCreate {
  name: string;
  hullId: string;
  model?: string;
  usageType?: string;
  clientId: number;
  marinaId?: number;
  engines?: EngineCreate[];
}

export interface BoatUpdate {
  name?: string;
  hullId?: string;
  model?: string;
  usageType?: string;
  clientId?: number;
  marinaId?: number;
  engines?: EngineUpdate[];
}

export interface Part {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  quantity: number;
  cost: number;
  price: number;
  minStock: number;
  location?: string;
}

export interface PartCreate {
  sku: string;
  name: string;
  barcode?: string;
  quantity?: number;
  cost?: number;
  price?: number;
  minStock?: number;
  location?: string;
}

export interface PartUpdate {
  name?: string;
  quantity?: number;
  cost?: number;
  price?: number;
  minStock?: number;
  location?: string;
  sku?: string;
  barcode?: string;
}

export interface StockMovement {
  id: number;
  partId: number;
  type: string;
  quantity: number;
  date: string;
  referenceId?: string;
  description: string;
  user?: string;
}

export interface StockMovementCreate {
  partId: number;
  type: string;
  quantity: number;
  description: string;
  referenceId?: string;
  user?: string;
}

export interface ServiceItem {
  id: number;
  type: ItemType;
  description: string;
  partId?: number;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  total: number;
  orderId: number;
}

export interface ServiceItemCreate {
  type: ItemType;
  description: string;
  partId?: number;
  quantity: number;
  unitCost?: number;
  unitPrice: number;
  total: number;
}

export interface OrderNote {
  id: number;
  orderId: number;
  text: string;
  userName?: string;
  createdAt: string;
}

export interface OrderNoteCreate {
  text: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  type: 'BOAT' | 'ENGINE';
  models: Model[];
}

export interface Model {
  id: number;
  name: string;
  manufacturer_id: number;
}

export interface CompanyInfo {
    id?: number;
    company_name?: string;
    trade_name?: string;
    cnpj?: string;
    ie?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip?: string;
    crt?: string;
    environment?: string;
}

export interface ServiceOrder {
  id: number;
  boatId: number;
  engineId?: number;
  description: string;
  diagnosis?: string;
  status: OSStatus;
  items: ServiceItem[];
  totalValue: number;
  createdAt: string;
  requester?: string;
  technicianName?: string;
  notes: OrderNote[];
  scheduledAt?: string;
  estimatedDuration?: number;
}

export interface ServiceOrderCreate {
  boatId: number;
  engineId?: number;
  description: string;
  diagnosis?: string;
  status?: OSStatus;
  estimatedDuration?: number;
}

export interface ServiceOrderUpdate {
  description?: string;
  diagnosis?: string;
  status?: OSStatus;
  technicianName?: string;
  scheduledAt?: string;
  estimatedDuration?: number;
}

export interface InvoiceItem {
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  partId?: number;
}

export interface Invoice {
  id?: string;
  number: string;
  supplier: string;
  date: string;
  items: InvoiceItem[];
  totalValue: number;
}

export interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  orderId?: number;
  documentNumber?: string;
}

export interface TransactionCreate {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  status?: string;
  orderId?: number;
  documentNumber?: string;
}

// --- FISCAL (NF-e / NFS-e) ---

export enum FiscalDocType {
  NFE = 'NF-e',
  NFSE = 'NFS-e'
}

export enum FiscalStatus {
  DRAFT = 'Rascunho',
  TRANSMITTING = 'Transmitindo',
  AUTHORIZED = 'Autorizada',
  REJECTED = 'Rejeitada',
  CANCELED = 'Cancelada'
}

export interface FiscalIssuer {
  cnpj: string;
  ie: string;
  im?: string;
  companyName: string;
  tradeName: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  crt: '1' | '2' | '3' | '4'; // 1=Simples Nacional, 4=MEI
  certificate?: string; // Base64 or path
  environment: 'homologation' | 'production';
}

export interface FiscalInvoice {
  id: string;
  type: FiscalDocType;
  number?: string;
  series?: string;
  status: FiscalStatus;
  issuedAt: string;
  recipientName: string;
  recipientDoc: string;
  totalValue: number;
  authorizationProtocol?: string;
  xml?: string;
  pdfUrl?: string;
  rejectionReason?: string;
}

export interface FiscalDataPayload {
  type: 'nfe' | 'nfse';
  client: { name: string; doc: string };
  items?: { code: string; desc: string; qty: number; price: number; total: number }[]; // For NF-e
  serviceValue?: number; // For NFS-e
  serviceDesc?: string; // For NFS-e
}