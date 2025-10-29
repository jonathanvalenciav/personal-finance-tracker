export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum PaymentMethod {
  BANK = 'bank',
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
}

export enum DebtType {
  I_OWE = 'i_owe',
  THEY_OWE_ME = 'they_owe_me',
}

export enum CreditCardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Category {
  id: string;
  name: string;
  icon?: string; // e.g., 'fa-utensils'
  color?: string; // e.g., 'bg-orange-500'
}

export interface CreditCard {
  id: string;
  name: string;
  cutOffDay: number;
  paymentDay: number;
  status: CreditCardStatus;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO string
  type: TransactionType;
  category: string;
  location: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
}

export interface Debt {
  id:string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // ISO string
  type: DebtType;
  person: string;
  billingCycleIdentifier?: string; // To group credit card debts
}

export interface FixedExpense {
  id:string;
  description: string;
  amount: number;
  category: string;
  paymentDay: number; // 1-31
}

export type ActiveTab = 'dashboard' | 'debts' | 'fixedExpenses' | 'categories' | 'settings';