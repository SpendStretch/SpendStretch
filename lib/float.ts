import { Card, CardWithFloat, FloatStatus } from './types';

export function calculateFloat(card: Card): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextCloseMonth = currentMonth;
  let nextCloseYear = currentYear;

  if (currentDay >= card.statement_close_day) {
    nextCloseMonth += 1;
    if (nextCloseMonth > 11) {
      nextCloseMonth = 0;
      nextCloseYear += 1;
    }
  }

  const nextCloseDate = new Date(nextCloseYear, nextCloseMonth, card.statement_close_day);

  let dueMonth = nextCloseMonth;
  let dueYear = nextCloseYear;

  if (card.payment_due_day <= card.statement_close_day) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  const paymentDueDate = new Date(dueYear, dueMonth, card.payment_due_day);

  const diffTime = paymentDueDate.getTime() - today.getTime();
  const floatDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return floatDays;
}

export function getNextCloseDate(card: Card): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextCloseMonth = currentMonth;
  let nextCloseYear = currentYear;

  if (currentDay >= card.statement_close_day) {
    nextCloseMonth += 1;
    if (nextCloseMonth > 11) {
      nextCloseMonth = 0;
      nextCloseYear += 1;
    }
  }

  return new Date(nextCloseYear, nextCloseMonth, card.statement_close_day);
}

export function getPaymentDueDate(card: Card): Date {
  const nextCloseDate = getNextCloseDate(card);
  const closeMonth = nextCloseDate.getMonth();
  const closeYear = nextCloseDate.getFullYear();

  let dueMonth = closeMonth;
  let dueYear = closeYear;

  if (card.payment_due_day <= card.statement_close_day) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  return new Date(dueYear, dueMonth, card.payment_due_day);
}

export function getFloatStatus(floatDays: number): FloatStatus {
  if (floatDays >= 45) return 'Excellent';
  if (floatDays >= 30) return 'Good';
  if (floatDays >= 15) return 'Fair';
  return 'Avoid';
}

export function getDaysUntilClose(card: Card): number {
  const today = new Date();
  const nextClose = getNextCloseDate(card);
  const diff = nextClose.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function enrichCardWithFloat(card: Card, currentCycle: import('./types').BillingCycle | null): CardWithFloat {
  const floatDays = calculateFloat(card);
  const floatStatus = getFloatStatus(floatDays);
  const nextCloseDate = getNextCloseDate(card);
  const paymentDueDate = getPaymentDueDate(card);
  const daysUntilClose = getDaysUntilClose(card);

  return {
    ...card,
    floatDays,
    floatStatus,
    nextCloseDate,
    paymentDueDate,
    daysUntilClose,
    currentCycle,
  };
}

export function sortCardsByFloat(cards: CardWithFloat[]): CardWithFloat[] {
  return [...cards].sort((a, b) => b.floatDays - a.floatDays);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function parseDateLocal(date: Date | string): Date {
  if (typeof date !== 'string') return date;
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: Date | string): string {
  return parseDateLocal(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(date: Date | string): string {
  return parseDateLocal(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDayOrdinal(day: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
