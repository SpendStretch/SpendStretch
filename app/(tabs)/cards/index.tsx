import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { Card, BillingCycle, CardWithFloat } from '@/lib/types';
import { getDayOrdinal, enrichCardWithFloat, sortCardsByFloat, formatCurrency } from '@/lib/float';
import AdBanner from '@/components/AdBanner';
import DrawerMenu from '@/components/DrawerMenu';
import SpendStretchLogo from '@/components/SpendStretchLogo';

function DonutChart({ used, total, size = 80 }: { used: number; total: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const usedRatio = total > 0 ? Math.min(used / total, 1) : 0;
  const usedDash = usedRatio * circumference;
  const center = size / 2;

  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={center} cy={center} r={radius}
        stroke="#E5E5EA" strokeWidth={10} fill="none"
      />
      {/* Used arc */}
      <Circle
        cx={center} cy={center} r={radius}
        stroke="#0A84FF" strokeWidth={10} fill="none"
        strokeDasharray={`${usedDash} ${circumference - usedDash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        rotation={-90} originX={center} originY={center}
      />
    </Svg>
  );
}

function CardRow({ card, isPriority }: { card: CardWithFloat; isPriority: boolean }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/cards/${card.id}`)}
      activeOpacity={0.95}
      style={{
        backgroundColor: isPriority ? '#EBF4FF' : '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: isPriority ? 2 : 1,
        borderColor: isPriority ? '#0A84FF' : '#E5E5EA',
        overflow: 'hidden',
      }}
    >
      {isPriority && (
        <View style={{
          position: 'absolute', top: 0, right: 0,
          backgroundColor: '#0A84FF', paddingHorizontal: 8, paddingVertical: 3,
          borderBottomLeftRadius: 8,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Priority
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          {/* Name + bank */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1C1C1E' }}>{card.card_name}</Text>
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>· {card.bank_name}</Text>
          </View>

          {/* last4 · limit · closes/due */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            {card.last_four && (
              <Text style={{ fontSize: 12, color: '#8E8E93', fontVariant: ['tabular-nums'] }}>
                ...{card.last_four}
              </Text>
            )}
            {card.credit_limit && (
              <Text style={{ fontSize: 12, color: '#0A84FF', fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                ${Number(card.credit_limit).toLocaleString()} limit
              </Text>
            )}
            <Text style={{ fontSize: 11, color: '#8E8E93', opacity: 0.8 }}>
              Closes{' '}
              <Text style={{ color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                {getDayOrdinal(card.statement_close_day)}
              </Text>
              , Due{' '}
              <Text style={{ color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                {getDayOrdinal(card.payment_due_day)}
              </Text>
            </Text>
          </View>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={22}
          color={isPriority ? '#0A84FF' : '#8E8E93'}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function CardsScreen() {
  const [cards, setCards] = useState<CardWithFloat[]>([]);
  const [upcomingDues, setUpcomingDues] = useState(0);
  const [upcomingDueAmount, setUpcomingDueAmount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const router = useRouter();

  async function fetchCards() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cardData } = await supabase
      .from('cards').select('*').eq('user_id', user.id).order('created_at', { ascending: true });

    if (!cardData) return;

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const sevenDaysStr = sevenDaysOut.toISOString().split('T')[0];

    const { data: cycleData } = await supabase
      .from('billing_cycles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('payment_due_date', today);

    const cycleMap: Record<string, BillingCycle> = {};
    (cycleData ?? []).forEach((c: BillingCycle) => {
      if (!cycleMap[c.card_id]) cycleMap[c.card_id] = c;
    });

    const upcomingCycles = (cycleData ?? []).filter((c: BillingCycle) => c.payment_due_date <= sevenDaysStr);
    setUpcomingDues(upcomingCycles.length);
    const dueAmount = upcomingCycles.reduce((sum: number, c: BillingCycle) =>
      sum + (c.is_minimum_only ? c.minimum_payment : (c.statement_balance - c.amount_paid)), 0);
    setUpcomingDueAmount(dueAmount);

    const bal = (cycleData ?? []).reduce((sum: number, c: BillingCycle) => sum + (c.statement_balance - c.amount_paid), 0);
    setTotalBalance(Math.max(bal, 0));

    const enriched = (cardData as Card[]).map((card) =>
      enrichCardWithFloat(card, cycleMap[card.id] ?? null)
    );
    setCards(sortCardsByFloat(enriched));
  }

  async function load(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    await fetchCards();
    if (!isRefresh) setLoading(false);
    if (isRefresh) setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleDelete(id: string) {
    Alert.alert('Delete card', 'This will also delete all billing cycle history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('cards').delete().eq('id', id); load(); } },
    ]);
  }

  const owners = [...new Set(cards.map((c) => c.card_owner))];
  const grouped = owners.map((owner) => ({ owner, cards: cards.filter((c) => c.card_owner === owner) }));
  const topCardId = cards[0]?.id ?? null;
  const totalLimit = cards.reduce((sum, c) => sum + (c.credit_limit ?? 0), 0);

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
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      {/* Top nav */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="menu" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <SpendStretchLogo size={15} />
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cards/add')}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="add" size={26} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#0A84FF" />
        }
      >
        {/* Page header */}
        <View style={{ marginBottom: 28, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5 }}>My cards</Text>
          <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>Manage your elastic credit limits</Text>
        </View>

        {cards.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 64 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MaterialIcons name="credit-card" size={36} color="#0A84FF" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 }}>No cards yet</Text>
            <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32, lineHeight: 22, marginBottom: 24 }}>
              Add your first credit card to start tracking float and payment due dates.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/cards/add')}
              style={{ backgroundColor: '#0A84FF', borderRadius: 8, paddingHorizontal: 24, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add your first card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {grouped.map((group) => (
              <View key={group.owner} style={{ marginBottom: 32 }}>
                <Text style={{
                  fontSize: 10, fontWeight: '700', color: '#8E8E93',
                  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, paddingHorizontal: 4,
                }}>
                  {group.owner}
                </Text>
                <View style={{ gap: 10 }}>
                  {group.cards.map((card) => (
                    <CardRow key={card.id} card={card} isPriority={card.id === topCardId} />
                  ))}
                </View>
              </View>
            ))}

            {/* Stats bento */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              {/* Donut chart tile */}
              <View style={{ flex: 1, backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, alignSelf: 'flex-start' }}>
                  Credit usage
                </Text>
                <DonutChart used={totalBalance} total={totalLimit} size={84} />
                <View style={{ gap: 10, marginTop: 12, alignSelf: 'stretch' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A84FF', marginTop: 3 }} />
                    <View>
                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>Balance</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(totalBalance)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E5EA', marginTop: 3 }} />
                    <View>
                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>Limit</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(totalLimit)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ flex: 1, backgroundColor: '#E9E9EE', borderRadius: 12, padding: 16, justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                  Upcoming Dues
                </Text>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9500', marginTop: 3 }} />
                    <View>
                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>Cards due</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                        {upcomingDues} {upcomingDues === 1 ? 'card' : 'cards'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginTop: 3 }} />
                    <View>
                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>Amount due</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(upcomingDueAmount)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <AdBanner />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
