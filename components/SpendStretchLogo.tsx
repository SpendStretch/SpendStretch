import { View, Text } from 'react-native';

export default function SpendStretchLogo({ size = 16 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: size, fontWeight: '500', color: '#141413' }}>Spend</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: size * 0.25 }}>
        <Text style={{ fontSize: size, fontWeight: '400', color: '#0A84FF' }}>{'<'}</Text>
        <View style={{ flexDirection: 'row', paddingHorizontal: 2 }}>
          {['S', 't', 'r', 'e', 't', 'c', 'h'].map((letter, i) => (
            <Text
              key={i}
              style={{
                fontSize: size,
                fontWeight: '500',
                color: '#0A84FF',
                letterSpacing: (i + 1) * (size * 0.075),
              }}
            >
              {letter}
            </Text>
          ))}
        </View>
        <Text style={{ fontSize: size, fontWeight: '400', color: '#0A84FF' }}>{'>'}</Text>
      </View>
    </View>
  );
}
