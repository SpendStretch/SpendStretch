import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Card, BillingCycle, CardFormData } from '@/lib/types';
import {
  calculateFloat, getFloatStatus, getNextCloseDate, getPaymentDueDate,
  getDaysUntilClose, formatCurrency, formatDate, getDayOrdinal,
} from '@/lib/float';
import { pickAndParseStatement, parsedToFormData } from '@/lib/parseStatement';
import CardForm from '@/components/CardForm';
import FloatBadge from '@/components/FloatBadge';

const LABEL_STYLE = {
  fontSize: 11, fontWeight: '600' as const, color: '#8E8E93',
  textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6, marginLeft: 4,
};

const INPUT_STYLE = {
  backgroundColor: '#F2F2F7', borderRadius: 8, height: 48,
  paddingHorizontal: 16, fontSize: 16, color: '#1C1C1E', fontVariant: ['tabular-nums'] as const,
};

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>
      {title}
    </Text>
  );
}

function InfoRow({ label, value, mono = false, last = false, accent }: { label: string; value: string; mono?: boolean; last?: boolean; accent?: string }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: '#F2F2F7',
    }}>
      <Text style={{ fontSize: 15, color: '#8E8E93' }}>{label}</Text>
      <Text style={{
        fontSize: 15, color: accent ?? '#1C1C1E', fontWeight: '500',
        fontVariant: mono ? ['tabular-nums'] : undefined,
        textAlign: 'right', flex: 1, marginLeft: 16,
      }}>
        {value}
      </Text>
    </View>
  );
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [card, setCard] = useState<Card | null>(null);
  const [cycle, setCycle] = useState<BillingCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [balance, setBalance] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [savingCycle, setSavingCycle] = useState(false);

  // Upload statement state
  const [parsingCard, setParsingCard] = useState(false);
  const [parsingCycle, setParsingCycle] = useState(false);
  const [cardFormKey, setCardFormKey] = useState(0);
  const [parsedCardData, setParsedCardData] = useState<Partial<CardFormData>>({});
  const [parsedCycleFile, setParsedCycleFile] = useState<string | null>(null);

  async function fetchCard() {
    const { data: cardData } = await supabase.from('cards').select('*').eq('id', id).single();
    if (!cardData) return;
    setCard(cardData as Card);

    const today = new Date().toISOString().split('T')[0];
    const { data: cycleData } = await supabase
      .from('billing_cycles').select('*').eq('card_id', id)
      .gte('payment_due_date', today).order('payment_due_date', { ascending: true }).limit(1).maybeSingle();

    if (cycleData) {
      setCycle(cycleData as BillingCycle);
      setBalance(String(cycleData.statement_balance));
      setAmountPaid(String(cycleData.amount_paid));
      setMinPayment(String(cycleData.minimum_payment));
      setIsPaid(cycleData.is_paid);
    }
  }

  useEffect(() => { fetchCard().then(() => setLoading(false)); }, [id]);

  async function handleCardUpdate(form: CardFormData) {
    const { error } = await supabase.from('cards').update({
      card_name: form.card_name.trim(), bank_name: form.bank_name.trim(),
      last_four: form.last_four.trim() || null, card_owner: form.card_owner.trim(),
      statement_close_day: form.statement_close_day, payment_due_day: form.payment_due_day,
      credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      card_type: form.card_type, updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { Alert.alert('Error', error.message); return; }
    setEditing(false);
    fetchCard();
  }

  async function handleSaveCycle() {
    if (!card) return;
    setSavingCycle(true);
    const nextClose = getNextCloseDate(card);
    const dueDate = getPaymentDueDate(card);
    const payload = {
      card_id: card.id, user_id: card.user_id,
      statement_close_date: nextClose.toISOString().split('T')[0],
      payment_due_date: dueDate.toISOString().split('T')[0],
      statement_balance: parseFloat(balance) || 0,
      minimum_payment: parseFloat(minPayment) || 0,
      amount_paid: parseFloat(amountPaid) || 0,
      is_paid: isPaid, is_minimum_only: false,
    };
    if (cycle) {
      await supabase.from('billing_cycles').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', cycle.id);
    } else {
      await supabase.from('billing_cycles').insert(payload);
    }
    setSavingCycle(false);
    fetchCard();
  }

  async function handleUploadForCard() {
    setParsingCard(true);
    try {
      const { parsed, fileName: _ } = await pickAndParseStatement();
      const prefilled = parsedToFormData(parsed);
      setParsedCardData(prefilled);
      setCardFormKey(k => k + 1);
    } catch (err: any) {
      if (err.message !== 'CANCELLED') {
        Alert.alert('Could not read statement', err.message ?? 'Please try again.');
      }
    } finally {
      setParsingCard(false);
    }
  }

  async function handleUploadForCycle() {
    setParsingCycle(true);
    try {
      const { parsed, fileName } = await pickAndParseStatement();
      if (parsed.statement_balance != null) setBalance(String(parsed.statement_balance));
      if (parsed.minimum_payment != null) setMinPayment(String(parsed.minimum_payment));
      setParsedCycleFile(fileName);
    } catch (err: any) {
      if (err.message !== 'CANCELLED') {
        Alert.alert('Could not read statement', err.message ?? 'Please try again.');
      }
    } finally {
      setParsingCycle(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete card', 'This will also delete all billing cycle history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('cards').delete().eq('id', id); router.back(); } },
    ]);
  }

  if (loading || !card) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0A84FF" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const floatDays = calculateFloat(card);
  const floatStatus = getFloatStatus(floatDays);
  const nextClose = getNextCloseDate(card);
  const dueDate = getPaymentDueDate(card);
  const daysUntilClose = getDaysUntilClose(card);
  const remaining = (parseFloat(balance) || 0) - (parseFloat(amountPaid) || 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 56, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#1C1C1E' }} numberOfLines={1}>{card.card_name}</Text>
        <TouchableOpacity onPress={() => setEditing((e) => !e)} style={{ paddingHorizontal: 12, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#0A84FF', fontSize: 16, fontWeight: '500' }}>{editing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {editing ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Upload statement option */}
          <TouchableOpacity
            onPress={handleUploadForCard}
            disabled={parsingCard}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12,
              padding: 14, marginBottom: 20,
              opacity: parsingCard ? 0.6 : 1,
            }}
            activeOpacity={0.7}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
              {parsingCard
                ? <ActivityIndicator size="small" color="#0A84FF" />
                : <MaterialIcons name="upload-file" size={18} color="#0A84FF" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}>
                {parsingCard ? 'Reading PDF…' : 'Import from statement'}
              </Text>
              <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 1 }}>Auto-fill card details from a PDF</Text>
            </View>
            {!parsingCard && <MaterialIcons name="chevron-right" size={20} color="#C7C7CC" />}
          </TouchableOpacity>

          <CardForm
            key={cardFormKey}
            initialData={cardFormKey > 0 ? parsedCardData : {
              card_name: card.card_name, bank_name: card.bank_name,
              last_four: card.last_four ?? '', card_owner: card.card_owner,
              statement_close_day: card.statement_close_day, payment_due_day: card.payment_due_day,
              credit_limit: card.credit_limit ? String(card.credit_limit) : '',
              card_type: card.card_type,
            }}
            onSubmit={handleCardUpdate}
            submitLabel="Save changes"
          />
          <TouchableOpacity onPress={handleDelete} style={{ marginTop: 24, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#FF3B30', fontSize: 15, fontWeight: '500' }}>Delete this card</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>

          {/* Float hero */}
          <View style={{
            backgroundColor: '#E8F4FD', borderRadius: 16, padding: 24,
            alignItems: 'center', marginBottom: 28,
          }}>
            <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              Float if you buy today
            </Text>
            <Text style={{
              fontSize: 64, fontWeight: '500', color: '#0A84FF',
              fontVariant: ['tabular-nums'], lineHeight: 72,
            }}>
              {floatDays}
            </Text>
            <Text style={{ fontSize: 16, color: '#8E8E93', marginBottom: 12 }}>days</Text>
            <FloatBadge status={floatStatus} />
          </View>

          {/* Current billing cycle */}
          <SectionHeader title="Current billing cycle" />
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', padding: 16, gap: 14, marginBottom: 24 }}>

            {/* Import from statement */}
            <TouchableOpacity
              onPress={handleUploadForCycle}
              disabled={parsingCycle}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: '#F2F2F7', borderRadius: 8, padding: 12,
                opacity: parsingCycle ? 0.6 : 1,
              }}
              activeOpacity={0.7}
            >
              {parsingCycle
                ? <ActivityIndicator size="small" color="#0A84FF" />
                : <MaterialIcons name="upload-file" size={16} color="#0A84FF" />}
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#0A84FF', flex: 1 }}>
                {parsingCycle ? 'Reading PDF…' : 'Import from statement'}
              </Text>
              {parsedCycleFile && !parsingCycle && (
                <Text style={{ fontSize: 11, color: '#34C759', fontWeight: '500' }}>✓ filled</Text>
              )}
            </TouchableOpacity>

            <View>
              <Text style={LABEL_STYLE}>Statement balance</Text>
              <TextInput style={INPUT_STYLE} placeholder="0.00" placeholderTextColor="#C7C7CC" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={LABEL_STYLE}>Amount paid</Text>
                <TextInput style={INPUT_STYLE} placeholder="0.00" placeholderTextColor="#C7C7CC" value={amountPaid} onChangeText={setAmountPaid} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={LABEL_STYLE}>Minimum due</Text>
                <TextInput style={INPUT_STYLE} placeholder="0.00" placeholderTextColor="#C7C7CC" value={minPayment} onChangeText={setMinPayment} keyboardType="decimal-pad" />
              </View>
            </View>

            {parseFloat(balance) > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 14, color: '#8E8E93' }}>Remaining balance</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: remaining > 0 ? '#FF3B30' : '#34C759', fontVariant: ['tabular-nums'] }}>
                  {formatCurrency(Math.max(remaining, 0))}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 15, color: '#1C1C1E', fontWeight: '500' }}>Mark as paid</Text>
              <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ false: '#E5E5EA', true: '#34C759' }} thumbColor="#fff" />
            </View>

            <TouchableOpacity
              onPress={handleSaveCycle}
              disabled={savingCycle}
              style={{ backgroundColor: '#0A84FF', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.9}
            >
              {savingCycle ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          {/* Key dates */}
          <SectionHeader title="Key dates" />
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden', marginBottom: 24 }}>
            <InfoRow label="Statement closes" value={`${getDayOrdinal(card.statement_close_day)} of month`} />
            <InfoRow label="Payment due" value={`${getDayOrdinal(card.payment_due_day)} of month`} />
            <InfoRow label="Next closing date" value={formatDate(nextClose)} mono />
            <InfoRow label="Days until close" value={`${daysUntilClose} days`} mono />
            <InfoRow label="Next payment due" value={formatDate(dueDate)} mono last />
          </View>

          {/* Float info */}
          <SectionHeader title="Float info" />
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden', marginBottom: 8 }}>
            <InfoRow label="Days of float today" value={`${floatDays} days`} mono accent="#0A84FF" />
            <InfoRow label="Status" value={floatStatus} last accent={floatStatus === 'Excellent' ? '#1B7A2E' : floatStatus === 'Good' ? '#0A84FF' : floatStatus === 'Fair' ? '#CC7700' : '#CC2F26'} />
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
