import { View, Text, TouchableOpacity } from 'react-native';
import { PaymentWithCard, PaymentStatus } from '@/lib/types';
import { formatCurrency, formatShortDate } from '@/lib/float';

interface Props {
  payment: PaymentWithCard;
  onMarkPaid: (cycleId: string) => void;
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: '#34C759',
  due_soon: '#FF9500',
  overdue: '#FF3B30',
  upcoming: '#8E8E93',
};

export default function PaymentItem({ payment, onMarkPaid }: Props) {
  const accentColor = STATUS_COLORS[payment.paymentStatus];

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E5E5EA',
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>
            {payment.card.card_name}
          </Text>
          <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 2 }}>
            {payment.card.bank_name}
          </Text>
          <Text style={{ fontSize: 14, color: '#1C1C1E', marginTop: 6, fontVariant: ['tabular-nums'] }}>
            Due {formatShortDate(payment.payment_due_date)}
          </Text>
          {!payment.is_paid && (
            <Text style={{ fontSize: 12, color: accentColor, fontWeight: '600', marginTop: 2 }}>
              {payment.daysUntilDue < 0
                ? `${Math.abs(payment.daysUntilDue)} days overdue`
                : payment.daysUntilDue === 0
                ? 'Due today'
                : `${payment.daysUntilDue} days left`}
            </Text>
          )}
        </View>

        {/* Right */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ fontSize: 16, color: '#1C1C1E', fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {payment.is_minimum_only
              ? formatCurrency(payment.minimum_payment)
              : formatCurrency(payment.remainingBalance)}
          </Text>
          <Text style={{ fontSize: 12, color: '#8E8E93' }}>
            {payment.is_minimum_only
              ? `min · bal ${formatCurrency(payment.statement_balance)}`
              : `of ${formatCurrency(payment.statement_balance)}`}
          </Text>
          {!payment.is_paid ? (
            <TouchableOpacity
              onPress={() => onMarkPaid(payment.id)}
              style={{
                borderWidth: 1.5, borderColor: '#0A84FF', borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 5, marginTop: 4,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#0A84FF', fontSize: 13, fontWeight: '600' }}>Mark paid</Text>
            </TouchableOpacity>
          ) : (
            <View style={{
              backgroundColor: 'rgba(52,199,89,0.12)', borderRadius: 6,
              paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
            }}>
              <Text style={{ color: '#1B7A2E', fontSize: 12, fontWeight: '600' }}>Paid</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
