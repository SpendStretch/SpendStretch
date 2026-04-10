import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SpendStretchLogo from './SpendStretchLogo';

const DRAWER_WIDTH = 280;

const NAV_ITEMS = [
  { label: 'Home', route: '/', icon: 'home' as const },
  { label: 'Payments', route: '/payments', icon: 'calendar-today' as const },
  { label: 'My Cards', route: '/cards', icon: 'credit-card' as const },
  { label: 'Settings', route: '/settings', icon: 'settings' as const },
];

export default function DrawerMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function isActive(route: string) {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(route + '/');
  }

  function handleNavigate(route: string) {
    onClose();
    router.push(route as any);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: backdropOpacity,
          }}
        />
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        </TouchableWithoutFeedback>

        {/* Drawer panel */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: '#FFFFFF',
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View style={{
            backgroundColor: '#F5F4ED',
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 18,
            borderBottomWidth: 3,
            borderBottomColor: '#0A84FF',
          }}>
            <SpendStretchLogo size={22} />
            <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 6 }}>
              Swipe smarter. Pay later.
            </Text>
          </View>

          {/* Nav items */}
          <View style={{ paddingTop: 12, paddingHorizontal: 10 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 13,
                    borderRadius: 10,
                    marginBottom: 4,
                    backgroundColor: active ? '#E8F4FD' : 'transparent',
                  }}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={active ? '#0A84FF' : '#8E8E93'}
                  />
                  <Text style={{
                    fontSize: 15,
                    fontWeight: active ? '600' : '400',
                    color: active ? '#0A84FF' : '#1C1C1E',
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
