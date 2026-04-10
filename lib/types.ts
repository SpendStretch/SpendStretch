export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  notification_days_before: number[];
}

export type CardType = 'personal' | 'business';

export interface Card {
  id: string;
  user_id: string;
  card_name: string;
  bank_name: string;
  last_four: string | null;
  card_owner: string;
  statement_close_day: number;
  payment_due_day: number;
  credit_limit: number | null;
  is_active: boolean;
  card_type: CardType;
  created_at: string;
  updated_at: string;
}

export interface BillingCycle {
  id: string;
  card_id: string;
  user_id: string;
  statement_close_date: string;
  payment_due_date: string;
  statement_balance: number;
  minimum_payment: number;
  amount_paid: number;
  is_paid: boolean;
  is_minimum_only: boolean;
  created_at: string;
  updated_at: string;
}

export type FloatStatus = 'Excellent' | 'Good' | 'Fair' | 'Avoid';

export interface CardWithFloat extends Card {
  floatDays: number;
  floatStatus: FloatStatus;
  nextCloseDate: Date;
  paymentDueDate: Date;
  daysUntilClose: number;
  currentCycle: BillingCycle | null;
}

export type PaymentStatus = 'paid' | 'due_soon' | 'overdue' | 'upcoming';

export interface PaymentWithCard extends BillingCycle {
  card: Card;
  paymentStatus: PaymentStatus;
  daysUntilDue: number;
  remainingBalance: number;
}

export type BankName =
  | 'Chase'
  | 'Citi'
  | 'Amex'
  | 'Capital One'
  | 'Bank of America'
  | 'Wells Fargo'
  | 'Barclays'
  | 'Synchrony'
  | 'TD'
  | 'Discover'
  | 'US Bank'
  | 'Other';

export const BANK_NAMES: BankName[] = [
  'Chase',
  'Citi',
  'Amex',
  'Capital One',
  'Bank of America',
  'Wells Fargo',
  'Barclays',
  'Synchrony',
  'TD',
  'Discover',
  'US Bank',
  'Other',
];

export interface CardFormData {
  card_name: string;
  bank_name: string;
  last_four: string;
  card_owner: string;
  statement_close_day: number;
  payment_due_day: number;
  credit_limit: string;
  card_type: CardType;
  statement_balance?: string;
  minimum_payment?: string;
  is_minimum_only?: boolean;
}

export interface ParsedStatement {
  card_name: string | null;
  bank_name: string | null;
  last_four: string | null;
  statement_close_date: string | null;
  payment_due_date: string | null;
  statement_balance: number | null;
  minimum_payment: number | null;
  credit_limit: number | null;
}
