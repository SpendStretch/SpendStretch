import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Card, BillingCycle, CardWithFloat } from '@/lib/types';
import { enrichCardWithFloat, sortCardsByFloat, formatCurrency } from '@/lib/float';
import CardFloatItem from '@/components/CardFloatItem';
import AdBanner from '@/components/AdBanner';
import DrawerMenu from '@/components/DrawerMenu';
import ProfileMenu from '@/components/ProfileMenu';
import SpendStretchLogo from '@/components/SpendStretchLogo';

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function utilColor(pct: number) {
  if (pct <= 30) return '#34C759';
  if (pct <= 60) return '#FF9500';
  return '#FF3B30';
}

interface DashboardStats {
  totalOutstanding: number;
  nextDueCycle: BillingCycle | null;
  nextDueCardName: string;
  nextDueDays: number;
  totalLimit: number;
  utilizationPct: number;
  overdueCount: number;
  overdueTotal: number;
  breakdown: { overdue: number; dueSoon: number; upcoming: number; paid: number };
  hasCycles: boolean;
}

interface PaymentItem {
  cycle: BillingCycle;
  cardName: string;
  bankName: string;
  lastFour: string | null;
  daysUntilDue: number; // negative = overdue
}

const CARD_LIMIT = 2;

export default function HomeScreen() {
  const [cards, setCards] = useState<CardWithFloat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const router = useRouter();

  async function fetchCards() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles').select('display_name').eq('id', user.id).single();
    if (profile) setDisplayName(profile.display_name);

    const { data: cardData } = await supabase
      .from('cards').select('*').eq('user_id', user.id).eq('is_active', true)
      .order('created_at', { ascending: true });
    if (!cardData) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [{ data: unpaidData }, { data: paidData }] = await Promise.all([
      supabase.from('billing_cycles').select('*').eq('user_id', user.id).eq('is_paid', false),
      supabase.from('billing_cycles').select('*').eq('user_id', user.id).eq('is_paid', true)
        .gte('payment_due_date', monthStart).lte('payment_due_date', monthEnd),
    ]);

    const allUnpaid = (unpaidData ?? []) as BillingCycle[];
    const paidThisMonth = (paidData ?? []) as BillingCycle[];

    const cardMap: Record<string, Card> = {};
    (cardData as Card[]).forEach(c => { cardMap[c.id] = c; });

    // Build map of future cycles for float enrichment
    const futureCycles = allUnpaid.filter(c => c.payment_due_date >= todayStr);
    const cycleMap: Record<string, BillingCycle> = {};
    futureCycles.forEach(c => { if (!cycleMap[c.card_id]) cycleMap[c.card_id] = c; });

    const enriched = (cardData as Card[]).map(card =>
      enrichCardWithFloat(card, cycleMap[card.id] ?? null)
    );
    setCards(sortCardsByFloat(enriched));

    // Cycles due today (0) or tomorrow (1)
    const todayTomorrowUnpaid = allUnpaid.filter(c => {
      const days = Math.ceil((parseDateLocal(c.payment_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 1;
    }).sort((a, b) => a.payment_due_date.localeCompare(b.payment_due_date));
    setPaymentItems(todayTomorrowUnpaid.map(c => ({
      cycle: c,
      cardName: cardMap[c.card_id]?.card_name ?? 'Card',
      bankName: cardMap[c.card_id]?.bank_name ?? '',
      lastFour: cardMap[c.card_id]?.last_four ?? null,
      daysUntilDue: Math.ceil((parseDateLocal(c.payment_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    })));

    // Dashboard stats
    const overdueCycles = allUnpaid.filter(c => c.payment_due_date < todayStr);
    const overdueCount = overdueCycles.length;
    const overdueTotal = overdueCycles.reduce((s, c) => s + (c.statement_balance - c.amount_paid), 0);
    const totalOutstanding = allUnpaid.reduce((s, c) => s + (c.statement_balance - c.amount_paid), 0);
    const totalLimit = (cardData as Card[]).reduce((s, c) => s + (c.credit_limit ?? 0), 0);
    const utilizationPct = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;

    const sorted = [...allUnpaid].sort((a, b) => a.payment_due_date.localeCompare(b.payment_due_date));
    const nextDueCycle = sorted[0] ?? null;
    const nextDueCardName = nextDueCycle ? (cardMap[nextDueCycle.card_id]?.card_name ?? '') : '';
    const nextDueDays = nextDueCycle
      ? Math.ceil((parseDateLocal(nextDueCycle.payment_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const thisMonthUnpaid = allUnpaid.filter(c => c.payment_due_date >= monthStart && c.payment_due_date <= monthEnd);
    const breakdown = {
      overdue: thisMonthUnpaid.filter(c => c.payment_due_date < todayStr).length,
      dueSoon: thisMonthUnpaid.filter(c => {
        const days = Math.ceil((parseDateLocal(c.payment_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      }).length,
      upcoming: thisMonthUnpaid.filter(c => {
        const days = Math.ceil((parseDateLocal(c.payment_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days > 7;
      }).length,
      paid: paidThisMonth.length,
    };

    setStats({
      totalOutstanding, nextDueCycle, nextDueCardName, nextDueDays,
      totalLimit, utilizationPct, overdueCount, overdueTotal, breakdown,
      hasCycles: allUnpaid.length > 0 || paidThisMonth.length > 0,
    });
  }

  async function load(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    await fetchCards();
    if (!isRefresh) setLoading(false);
    if (isRefresh) setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const owners = new Set(cards.map(c => c.card_owner));
  const showOwner = owners.size > 1;
  const visibleCards = showAll ? cards : cards.slice(0, CARD_LIMIT);
  const hiddenCount = cards.length - CARD_LIMIT;

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
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
      }}>
        <TouchableOpacity onPress={() => setDrawerVisible(true)} style={{ width: 40, alignItems: 'flex-start' }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="menu" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <SpendStretchLogo size={16} />
        <TouchableOpacity onPress={() => setProfileMenuVisible(true)} style={{ width: 40, alignItems: 'flex-end' }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: profileMenuVisible ? '#0A84FF' : '#E5E5EA',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0A84FF' }}>
              {displayName ? displayName[0].toUpperCase() : '?'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <ProfileMenu visible={profileMenuVisible} onClose={() => setProfileMenuVisible(false)} />

      <FlatList
        data={visibleCards}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#0A84FF" />
        }
        ListHeaderComponent={
          <View>
            {/* ── Which card to use heading ── */}
            {cards.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A84FF' }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0A84FF', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Best card to use
                  </Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1C1C1E', lineHeight: 26 }}>
                  Which card should you use today?
                </Text>
                <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 3, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', fontVariant: ['tabular-nums'] }}>
                  {todayLabel}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MaterialIcons name="credit-card" size={36} color="#0A84FF" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 }}>No cards yet</Text>
            <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 }}>
              Add your first card to see which one gives you the most days before payment is due.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 24, backgroundColor: '#0A84FF', borderRadius: 8, paddingHorizontal: 24, height: 44, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => router.push('/(tabs)/cards/add')}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add a card</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <CardFloatItem card={item} isTop={index === 0} showOwner={showOwner} />
        )}
        ListFooterComponent={
          cards.length > 0 ? (
            <View>
              {/* Show more / less pill */}
              {hiddenCount > 0 && (
                <TouchableOpacity
                  onPress={() => setShowAll(v => !v)}
                  style={{ alignItems: 'center', marginTop: 16 }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    paddingHorizontal: 20, paddingVertical: 8,
                    borderRadius: 20, borderWidth: 1, borderColor: '#0A84FF',
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#0A84FF' }}>
                      {showAll ? 'Show less' : `Show ${hiddenCount} more ${hiddenCount === 1 ? 'card' : 'cards'}`}
                    </Text>
                    <MaterialIcons name={showAll ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color="#0A84FF" />
                  </View>
                </TouchableOpacity>
              )}

              {/* ── Due Today & Tomorrow ── */}
              <View style={{ marginTop: 28 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1C1E', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Due Today & Tomorrow
                  </Text>
                </View>
                {paymentItems.length === 0 ? (
                  <View style={{
                    backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}>
                    <MaterialIcons name="check-circle" size={20} color="#34C759" />
                    <Text style={{ fontSize: 14, color: '#8E8E93' }}>No cards due today or tomorrow</Text>
                  </View>
                ) : (
                  paymentItems.map(item => {
                    const isToday = item.daysUntilDue === 0;
                    return (
                      <View key={item.cycle.id} style={{
                        backgroundColor: isToday ? '#FFF2F2' : '#FFF8F0',
                        borderWidth: 1,
                        borderColor: isToday ? '#FFD0D0' : '#FFE4B5',
                        borderRadius: 12, padding: 14, marginBottom: 8,
                        flexDirection: 'row', alignItems: 'center',
                      }}>
                        <View style={{
                          width: 40, height: 40, borderRadius: 10,
                          backgroundColor: isToday ? '#FF3B30' : '#FF9500',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          <MaterialIcons name="credit-card" size={20} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}>
                            {item.cardName}{item.lastFour ? ` ···· ${item.lastFour}` : ''}
                          </Text>
                          <Text style={{ fontSize: 12, color: isToday ? '#FF3B30' : '#FF9500', marginTop: 2, fontWeight: '600' }}>
                            {isToday ? 'Due today' : 'Due tomorrow'}
                            {item.bankName ? ` · ${item.bankName}` : ''}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: isToday ? '#FF3B30' : '#FF9500', fontVariant: ['tabular-nums'] }}>
                            {formatCurrency(item.cycle.statement_balance - item.cycle.amount_paid)}
                          </Text>
                          {item.cycle.minimum_payment > 0 && (
                            <Text style={{ fontSize: 10, color: '#8E8E93', marginTop: 2, fontVariant: ['tabular-nums'] }}>
                              min {formatCurrency(item.cycle.minimum_payment)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* ── Financial Pulse ── */}
              {stats?.hasCycles && (
                <View style={{ marginTop: 28 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                      Your Financial Pulse
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                  </View>

                  {/* Overdue alert */}
                  {stats.overdueCount > 0 && (
                    <View style={{
                      backgroundColor: '#FFF2F2', borderWidth: 1, borderColor: '#FFD0D0',
                      borderRadius: 12, padding: 14, marginBottom: 10,
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                    }}>
                      <Text style={{ fontSize: 22 }}>🚨</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF3B30' }}>
                          {stats.overdueCount} overdue {stats.overdueCount === 1 ? 'payment' : 'payments'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#FF3B30', opacity: 0.8, marginTop: 2 }}>
                          {formatCurrency(stats.overdueTotal)} past due — act now
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Next due + Total owed */}
                  {stats.nextDueCycle && (
                    <View style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, flexDirection: 'row', marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                          Next Payment Due
                        </Text>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                          {formatCurrency(stats.nextDueCycle.statement_balance - stats.nextDueCycle.amount_paid)}
                        </Text>
                        <Text style={{ fontSize: 11, color: stats.nextDueDays <= 0 ? '#FF3B30' : stats.nextDueDays <= 7 ? '#FF9500' : '#8E8E93', marginTop: 3 }}>
                          {stats.nextDueCardName} · {stats.nextDueDays <= 0 ? 'overdue' : `in ${stats.nextDueDays}d`}
                        </Text>
                      </View>
                      <View style={{ width: 1, backgroundColor: '#E5E5EA', marginHorizontal: 16 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                          Total Owed
                        </Text>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                          {formatCurrency(stats.totalOutstanding)}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 3 }}>
                          across {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Credit utilization */}
                  {stats.totalLimit > 0 && (
                    <View style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Credit Utilization
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: utilColor(stats.utilizationPct), fontVariant: ['tabular-nums'] }}>
                          {Math.round(stats.utilizationPct)}%
                        </Text>
                      </View>
                      <View style={{ backgroundColor: '#E5E5EA', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <View style={{ height: 8, borderRadius: 6, width: `${Math.min(stats.utilizationPct, 100)}%`, backgroundColor: utilColor(stats.utilizationPct) }} />
                      </View>
                      <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 6, fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(stats.totalOutstanding)} / {formatCurrency(stats.totalLimit)} limit
                      </Text>
                    </View>
                  )}

                  {/* This month breakdown */}
                  {(() => {
                    const { overdue, dueSoon, upcoming, paid } = stats.breakdown;
                    const total = overdue + dueSoon + upcoming + paid;
                    if (total === 0) return null;
                    return (
                      <View style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                          This Month
                        </Text>
                        <View style={{ flexDirection: 'row', borderRadius: 6, overflow: 'hidden', height: 8, marginBottom: 12 }}>
                          {overdue > 0 && <View style={{ flex: overdue, backgroundColor: '#FF3B30' }} />}
                          {dueSoon > 0 && <View style={{ flex: dueSoon, backgroundColor: '#FF9500' }} />}
                          {upcoming > 0 && <View style={{ flex: upcoming, backgroundColor: '#0A84FF' }} />}
                          {paid > 0 && <View style={{ flex: paid, backgroundColor: '#34C759' }} />}
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                          {overdue > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FF3B30' }} /><Text style={{ fontSize: 11, color: '#8E8E93' }}>{overdue} Overdue</Text></View>}
                          {dueSoon > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FF9500' }} /><Text style={{ fontSize: 11, color: '#8E8E93' }}>{dueSoon} Due Soon</Text></View>}
                          {upcoming > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0A84FF' }} /><Text style={{ fontSize: 11, color: '#8E8E93' }}>{upcoming} Upcoming</Text></View>}
                          {paid > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#34C759' }} /><Text style={{ fontSize: 11, color: '#8E8E93' }}>{paid} Paid</Text></View>}
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              <View style={{ marginTop: 24 }}>
                <AdBanner />
              </View>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
