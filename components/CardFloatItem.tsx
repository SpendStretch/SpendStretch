import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CardWithFloat } from '@/lib/types';
import FloatBadge from './FloatBadge';

interface Props {
  card: CardWithFloat;
  isTop: boolean;
  showOwner: boolean;
}

export default function CardFloatItem({ card, isTop, showOwner }: Props) {
  const router = useRouter();
  const isAvoid = card.floatStatus === 'Avoid';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/cards/${card.id}`)}
      activeOpacity={0.97}
      style={{ opacity: isAvoid ? 0.6 : 1 }}
    >
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        borderWidth: isTop ? 1 : 1,
        borderColor: '#E5E5EA',
        borderLeftWidth: isTop ? 3 : 1,
        borderLeftColor: isTop ? '#0A84FF' : '#E5E5EA',
        shadowColor: isTop ? '#0A84FF' : '#000',
        shadowOffset: { width: 0, height: isTop ? 4 : 1 },
        shadowOpacity: isTop ? 0.06 : 0.05,
        shadowRadius: isTop ? 12 : 3,
        elevation: isTop ? 3 : 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {isTop && (
            <Text style={{
              fontSize: 10, fontWeight: '700', color: '#0A84FF',
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6,
            }}>
              Best card to use
            </Text>
          )}
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E', lineHeight: 20 }}>
            {card.card_name}
          </Text>
          <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 2 }}>
            {card.bank_name}
          </Text>
          {card.last_four && (
            <Text style={{ fontSize: 14, color: '#8E8E93', opacity: 0.6, marginTop: 2, fontVariant: ['tabular-nums'] }}>
              ....{card.last_four}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            {showOwner && (
              <View style={{
                backgroundColor: '#F2F2F7', borderRadius: 4,
                paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 12, color: '#8E8E93', fontWeight: '500' }}>
                  {card.card_owner}
                </Text>
              </View>
            )}
            <FloatBadge status={card.floatStatus} />
          </View>
        </View>

        {/* Right: float days */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 36, fontWeight: '500', lineHeight: 40,
            color: isAvoid ? '#FF3B30' : '#0A84FF',
            fontVariant: ['tabular-nums'],
          }}>
            {card.floatDays}
          </Text>
          <Text style={{
            fontSize: 10, color: '#8E8E93', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
          }}>
            {isTop ? 'days of float' : 'days'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
