import { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { BillingCycle, Card, PaymentWithCard, PaymentStatus } from '@/lib/types';
import PaymentItem from '@/components/PaymentItem';
import AdBanner from '@/components/AdBanner';

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getPaymentStatus(cycle: BillingCycle): PaymentStatus {
  if (cycle.is_paid) return 'paid';
  const today = new Date();
  const due = parseDateLocal(cycle.payment_due_date);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'due_soon';
  return 'upcoming';
}

function getDaysUntilDue(cycle: BillingCycle): number {
  const today = new Date();
  const due = parseDateLocal(cycle.payment_due_date);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type Section = { title: string; accent?: string; data: PaymentWithCard[] };

export default function PaymentsScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchPayments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cycles } = await supabase
      .from('billing_cycles')
      .select('*, cards(*)')
      .eq('user_id', user.id)
      .order('payment_due_date', { ascending: true });

    if (!cycles) return;

    const payments: PaymentWithCard[] = cycles.map((c: any) => ({
      ...c,
      card: c.cards as Card,
      paymentStatus: getPaymentStatus(c),
      daysUntilDue: getDaysUntilDue(c),
      remainingBalance: c.statement_balance - c.amount_paid,
    }));

    const today = new Date();
    const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + 7);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const thisWeek: PaymentWithCard[] = [];
    const thisMonth: PaymentWithCard[] = [];
    const nextMonth: PaymentWithCard[] = [];
    const later: PaymentWithCard[] = [];

    for (const p of payments) {
      const due = parseDateLocal(p.payment_due_date);
      if (p.daysUntilDue < 0 || due <= endOfWeek) thisWeek.push(p);
      else if (due <= endOfMonth) thisMonth.push(p);
      else if (due <= endOfNextMonth) nextMonth.push(p);
      else later.push(p);
    }

    const built: Section[] = [];
    if (thisWeek.length) built.push({ title: 'Due this week', accent: '#FF3B30', data: thisWeek });
    if (thisMonth.length) built.push({ title: 'Due this month', data: thisMonth });
    if (nextMonth.length) built.push({ title: 'Due next month', data: nextMonth });
    if (later.length) built.push({ title: 'Later', data: later });

    setSections(built);
  }

  async function load(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    await fetchPayments();
    if (!isRefresh) setLoading(false);
    if (isRefresh) setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleMarkPaid(cycleId: string) {
    Alert.alert('Mark as paid', 'Mark this payment as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: async () => {
          const cycle = sections.flatMap((s) => s.data).find((p) => p.id === cycleId);
          const amountPaid = cycle?.is_minimum_only
            ? (cycle.minimum_payment ?? 0)
            : (cycle?.statement_balance ?? 0);
          await supabase.from('billing_cycles').update({ is_paid: true, amount_paid: amountPaid }).eq('id', cycleId);
          load();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0A84FF" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#0A84FF" />
        }
        ListHeaderComponent={
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 24 }}>Payments</Text>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 8 }}>
            {section.accent && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: section.accent }} />
            )}
            <Text style={{ fontSize: 13, fontWeight: '600', color: section.accent ?? '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {section.title}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 64 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(52,199,89,0.1)',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <MaterialIcons name="check-circle" size={36} color="#34C759" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 }}>All caught up</Text>
            <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 }}>
              No upcoming payments. Add billing cycle data from your card detail screens.
            </Text>
          </View>
        }
        renderItem={({ item }) => <PaymentItem payment={item} onMarkPaid={handleMarkPaid} />}
        ListFooterComponent={sections.length > 0 ? <View style={{ marginTop: 32 }}><AdBanner /></View> : null}
      />
    </SafeAreaView>
  );
}
