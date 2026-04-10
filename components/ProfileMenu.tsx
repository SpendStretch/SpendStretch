import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function ProfileMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  async function handleSignOut() {
    onClose();
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => { await supabase.auth.signOut(); },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback>
            <View style={{
              position: 'absolute',
              top: insets.top + 52,
              right: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 8,
              borderWidth: 1,
              borderColor: '#E5E5EA',
              minWidth: 160,
              overflow: 'hidden',
            }}>
              <TouchableOpacity
                onPress={handleSignOut}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={18} color="#FF3B30" />
                <Text style={{ fontSize: 15, color: '#FF3B30', fontWeight: '500' }}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
