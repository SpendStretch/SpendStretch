import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { ParsedStatement, CardFormData, BANK_NAMES } from '@/lib/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/parse-statement`;

export function matchBankName(raw: string | null): string {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower.includes('chase') || lower.includes('jpmorgan')) return 'Chase';
  if (lower.includes('citi')) return 'Citi';
  if (lower.includes('amex') || lower.includes('american express')) return 'Amex';
  if (lower.includes('capital one')) return 'Capital One';
  if (lower.includes('bank of america') || lower.includes('bofa')) return 'Bank of America';
  if (lower.includes('wells fargo')) return 'Wells Fargo';
  if (lower.includes('barclays')) return 'Barclays';
  if (lower.includes('synchrony')) return 'Synchrony';
  if (lower.includes('td bank') || lower.includes('toronto-dominion')) return 'TD';
  if (lower.includes('discover')) return 'Discover';
  if (lower.includes('us bank') || lower.includes('u.s. bank')) return 'US Bank';
  const exact = BANK_NAMES.find(b => b.toLowerCase() === lower);
  return exact ?? raw;
}

export function extractDay(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const day = parseInt(dateStr.split('-')[2] ?? '', 10);
  return isNaN(day) || day < 1 || day > 31 ? null : day;
}

export function parsedToFormData(parsed: ParsedStatement): Partial<CardFormData> {
  return {
    card_name: parsed.card_name ?? '',
    bank_name: matchBankName(parsed.bank_name),
    last_four: parsed.last_four ?? '',
    statement_close_day: extractDay(parsed.statement_close_date) ?? 1,
    payment_due_day: extractDay(parsed.payment_due_date) ?? 25,
    statement_balance: parsed.statement_balance != null ? String(parsed.statement_balance) : '',
    minimum_payment: parsed.minimum_payment != null ? String(parsed.minimum_payment) : '',
    credit_limit: parsed.credit_limit != null ? String(parsed.credit_limit) : '',
  };
}

export async function pickAndParseStatement(): Promise<{ parsed: ParsedStatement; fileName: string }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });

  if (result.canceled) throw new Error('CANCELLED');

  const asset = result.assets[0];
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: 'base64',
  });

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ pdf_base64: base64, file_name: asset.name }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.message ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data?.error) throw new Error(data.error);

  return { parsed: data as ParsedStatement, fileName: asset.name };
}
