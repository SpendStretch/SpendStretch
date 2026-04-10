import { View, Text } from 'react-native';
import { FloatStatus } from '@/lib/types';

interface Props {
  status: FloatStatus;
}

const CONFIG: Record<FloatStatus, { bg: string; text: string; label: string }> = {
  Excellent: { bg: 'rgba(52,199,89,0.15)', text: '#1B7A2E', label: 'Excellent' },
  Good: { bg: 'rgba(10,132,255,0.15)', text: '#0A84FF', label: 'Good' },
  Fair: { bg: 'rgba(255,149,0,0.15)', text: '#CC7700', label: 'Fair' },
  Avoid: { bg: 'rgba(255,59,48,0.15)', text: '#CC2F26', label: 'Avoid' },
};

export default function FloatBadge({ status }: Props) {
  const config = CONFIG[status];
  return (
    <View
      style={{
        backgroundColor: config.bg,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: config.text, fontSize: 12, fontWeight: '500' }}>
        {config.label}
      </Text>
    </View>
  );
}
