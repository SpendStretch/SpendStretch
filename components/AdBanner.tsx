import { View, Text } from 'react-native';

// Placeholder banner — replace with actual expo-ads-admob when available
// expo-ads-admob is deprecated; use react-native-google-mobile-ads for production
export default function AdBanner() {
  return (
    <View
      style={{
        height: 50,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
      }}
    >
      <Text style={{ fontSize: 12, color: '#8E8E93' }}>Advertisement</Text>
    </View>
  );
}
