import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 16, paddingBottom: 32, alignItems: 'center' }}>

        {/* Logo */}
        <View style={{ height: 64, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1C1C1E' }}>Spend</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0A84FF', opacity: 0.7 }}>{'<'}</Text>
              <View style={{ flexDirection: 'row', paddingHorizontal: 2 }}>
                {['S','t','r','e','t','c','h'].map((letter, i) => (
                  <Text
                    key={i}
                    style={{ fontSize: 20, fontWeight: '700', color: '#0A84FF', letterSpacing: (i + 1) * 1.5 }}
                  >
                    {letter}
                  </Text>
                ))}
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0A84FF', opacity: 0.7 }}>{'>'}</Text>
            </View>
          </View>
        </View>

        {/* Tagline */}
        <Text style={{ fontSize: 13, color: '#8E8E93', letterSpacing: 0.5, marginBottom: 40 }}>
          Swipe smarter. Pay later.
        </Text>

        {/* Illustration */}
        <View style={{ width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
            {/* Background circle */}
            <View style={{
              position: 'absolute', width: 220, height: 220, borderRadius: 110,
              backgroundColor: '#E8F4FD', opacity: 0.5,
            }} />

            {/* Back card */}
            <View style={{
              position: 'absolute', width: 180, height: 110, borderRadius: 12,
              backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
              transform: [{ rotate: '-12deg' }, { translateX: -20 }, { translateY: -10 }],
            }} />

            {/* Front card */}
            <View style={{
              position: 'absolute', width: 180, height: 110, borderRadius: 12,
              backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(10,132,255,0.4)',
              shadowColor: '#0A84FF', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
              transform: [{ rotate: '3deg' }, { translateX: 10 }, { translateY: 5 }],
              padding: 16, justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: 'rgba(10,132,255,0.1)', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MaterialIcons name="credit-card" size={16} color="#0A84FF" />
                </View>
                <View style={{ width: 48, height: 16, borderRadius: 4, backgroundColor: '#F2F2F7' }} />
              </View>
              <View style={{ gap: 6 }}>
                <View style={{ width: 96, height: 8, borderRadius: 4, backgroundColor: '#E5E5EA' }} />
                <View style={{ width: 64, height: 8, borderRadius: 4, backgroundColor: '#F2F2F7' }} />
              </View>
            </View>

            {/* Clock badge */}
            <View style={{
              position: 'absolute', top: 8, right: 24, width: 56, height: 56,
              borderRadius: 14, backgroundColor: '#0A84FF',
              shadowColor: '#0A84FF', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
              alignItems: 'center', justifyContent: 'center',
              transform: [{ rotate: '-6deg' }],
            }}>
              <MaterialIcons name="schedule" size={28} color="#FFFFFF" />
            </View>

            {/* Due date badge */}
            <View style={{
              position: 'absolute', bottom: 16, left: 8,
              backgroundColor: '#FFFFFF', borderRadius: 999,
              borderWidth: 1, borderColor: '#E5E5EA',
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 8,
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
            }}>
              <MaterialIcons name="calendar-today" size={14} color="#0A84FF" />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#1C1C1E', letterSpacing: 0.5 }}>
                DUE IN 45 DAYS
              </Text>
            </View>
          </View>
        </View>

        {/* Copy */}
        <View style={{ alignItems: 'center', gap: 12, marginBottom: 'auto' }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: '#1C1C1E', textAlign: 'center', lineHeight: 30 }}>
            Know which card to use. Every time.
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 }}>
            SpendStretch tells you which credit card gives you the most time before your purchase is due for payment.
          </Text>
        </View>

        {/* Actions */}
        <View style={{ width: '100%', gap: 16, marginTop: 40 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#0A84FF', borderRadius: 12, height: 56,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#0A84FF', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
            }}
            onPress={() => router.replace('/(auth)/register')}
            activeOpacity={0.9}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={{ color: '#8E8E93', fontSize: 14 }}>
              Already have an account? <Text style={{ color: '#0A84FF', fontWeight: '600' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
