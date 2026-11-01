// ---- Auth ----
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  phone?: string;
  role: 'landlord' | 'tenant';
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- Unit ----
export interface Address {
  street: string;
  number: string;
  floor?: string | null;
  apartment?: string | null;
  neighborhood?: string | null;
  city: string;
  province: string;
}

export interface Facilities {
  waterShutoff?: string | null;
  gasShutoff?: string | null;
  electricalPanel?: string | null;
  meters?: string | null;
  notes?: string | null;
}

export type UtilityType = 'electricity' | 'gas' | 'water' | 'condominiumFees' | 'propertyTax';

export interface UtilityAccount {
  utilityType: UtilityType;
  provider: string;
  accountId: string;
  paidBy: 'tenant' | 'landlord';
}

export interface Unit {
  id: string;
  address: Address;
  unitType: 'apartment' | 'house';
  // Detail fields
  areaSqm?: number | null;
  propertyTaxAccount?: string | null;
  functionalUnit?: string | null;
  referenceValue?: string | null;
  facilities?: Facilities;
  utilityAccounts?: UtilityAccount[];
  createdAt?: string;
  updatedAt?: string;
  // List fields (from UnitListDTO)
  isOccupied?: boolean;
  tenant?: { name: string } | null;
  currentRent?: string | null;
}

export interface UnitInput {
  address: Address;
  unitType: 'apartment' | 'house';
  areaSqm?: number;
  propertyTaxAccount?: string | null;
  functionalUnit?: string | null;
  referenceValue?: string | null;
  facilities?: Facilities;
  utilityAccounts?: UtilityAccount[];
}

// ---- Lease ----
export type LeaseStatus = 'draft' | 'active' | 'ended';
export type AdjustmentIndex = 'IPC' | 'ICL' | 'UVA';

export interface ExtractedField {
  fieldName: string;
  value: unknown;
  sourceText?: string | null;
  status: 'pending' | 'confirmed' | 'corrected';
  correctedValue?: unknown | null;
}

export interface PaymentAccount {
  holderName: string;
  bank: string;
  cbuOrCvu: string;
  alias?: string | null;
}

export interface Lease {
  id: string;
  unitId: string;
  landlordId: string;
  tenantId?: string | null;
  startDate: string;
  endDate: string;
  initialRent: string;
  adjustmentIndex: AdjustmentIndex;
  adjustmentFrequencyMonths: number;
  securityDeposit?: string | null;
  status: LeaseStatus;
  document?: { fileId: string; fileName: string; mimeType: string; pageCount?: number | null } | null;
  extractedFields: ExtractedField[];
  paymentAccount?: PaymentAccount | null;
  endedAt?: string | null;
  tenantName?: string | null;
  tenantDni?: string | null;
  tenantEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseInput {
  startDate: string;
  endDate: string;
  initialRent: string;
  adjustmentIndex: AdjustmentIndex;
  adjustmentFrequencyMonths: number;
  securityDeposit?: string;
  tenantName?: string;
  tenantDni?: string;
  tenantEmail?: string;
}

// ---- Rent Adjustment ----
export type AdjustmentStatus = 'pending' | 'estimated' | 'confirmed';

export interface RentAdjustment {
  id: string;
  leaseId: string;
  effectiveDate: string;
  previousRent: string;
  startIndexValue?: string;
  endIndexValue?: string;
  minCoefficient?: string;
  maxCoefficient?: string;
  minAmount?: string;
  maxAmount?: string;
  pendingPeriods: string[];
  status: AdjustmentStatus;
  createdAt: string;
  updatedAt?: string;
}

// ---- Adjustment Summary ----
export interface IndexStats {
  lastValue: string;
  lastDate: string;
  avgMonthlyVariation: number;
  last3MonthVariation: number;
  last6MonthVariation: number;
  trend: Array<{ period: string; value: number }>;
}

export interface TimelineEntry {
  effectiveDate: string;
  status: string;
  previousRent: string;
  minAmount: string;
  maxAmount: string;
  minCoefficient: string;
  maxCoefficient: string;
  pendingPeriods: string[];
  startIndexValue: string | null;
  endIndexValue: string | null;
  variation: number;
}

export interface AdjustmentSummary {
  lease: {
    startDate: string;
    endDate: string;
    initialRent: string;
    adjustmentIndex: string;
    adjustmentFrequencyMonths: number;
  };
  nextAdjustment: RentAdjustment | null;
  daysUntilNext: number | null;
  currentRent: string;
  totalVariation: number;
  indexStats: IndexStats;
  timeline: TimelineEntry[];
  contractProgress: number;
}

// ---- Payment ----
export type PaymentStatus = 'submitted' | 'confirmed' | 'flagged';

export interface PaymentReceipt {
  id: string;
  leaseId: string;
  period: string;
  amount: string;
  expectedAmount?: string;
  paymentDate: string;
  file?: { fileName: string; mimeType: string } | null;
  status: PaymentStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface PaymentInput {
  period: string;
  amount: string;
  paymentDate: string;
}

// ---- Expense ----
export type ExpenseCategory = 'tax' | 'insurance' | 'maintenance' | 'condominiumFees' | 'other';

export interface Expense {
  id: string;
  unitId: string;
  date: string;
  category: ExpenseCategory;
  concept: string;
  amount: string;
  maintenanceRequestId?: string;
  createdAt: string;
}

export interface ExpenseInput {
  date: string;
  category: ExpenseCategory;
  concept: string;
  amount: string;
  maintenanceRequestId?: string;
}

// ---- Maintenance ----
export type MaintenanceStatus = 'open' | 'inProgress' | 'resolved' | 'closed';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'gas' | 'structural' | 'appliance' | 'other';

export interface StatusHistoryEntry {
  status: MaintenanceStatus;
  comment?: string | null;
  changedBy: string;
  changedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  leaseId: string;
  code: string;
  category: MaintenanceCategory;
  room: string;
  description: string;
  photos: Array<{ fileName: string; index: number }>;
  status: MaintenanceStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
}

export interface MaintenanceInput {
  category: MaintenanceCategory;
  room: string;
  description: string;
}

// ---- Notification ----
export type NotificationType =
  | 'adjustmentEstimated'
  | 'adjustmentFinal'
  | 'adjustmentNotified'
  | 'paymentSubmitted'
  | 'paymentConfirmed'
  | 'paymentFlagged'
  | 'maintenanceCreated'
  | 'maintenanceUpdated'
  | 'invitationSent'
  | 'leaseActivated'
  | 'leaseEnded';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity?: { entityType: string; entityId: string } | null;
  readAt?: string | null;
  createdAt: string;
}

// ---- Yield ----
export interface YieldResult {
  grossYield: string;
  netYield: string;
  realYield: string;
  inflationRate: string;
  vacancyMonths: number;
  monthlyBreakdown: {
    period: string;
    income: string;
    expenses: string;
    net: string;
  }[];
  expensesByCategory: {
    category: ExpenseCategory;
    total: string;
  }[];
}

// ---- Index Comparison ----
export interface IndexComparison {
  IPC: IndexEvolution;
  ICL: IndexEvolution;
  UVA: IndexEvolution;
}

export interface IndexEvolution {
  currentRent: string;
  totalVariation: string;
  history: {
    date: string;
    rent: string;
  }[];
}
