import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 32 }}>

          {/* Logo */}
          <View style={{ marginBottom: 48 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#1C1C1E' }}>Spend</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#0A84FF', opacity: 0.7 }}>{'<'}</Text>
                <View style={{ flexDirection: 'row', paddingHorizontal: 2 }}>
                  {['S','t','r','e','t','c','h'].map((letter, i) => (
                    <Text
                      key={i}
                      style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: '#0A84FF',
                        letterSpacing: (i + 1) * 1.5,
                      }}
                    >
                      {letter}
                    </Text>
                  ))}
                </View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#0A84FF', opacity: 0.7 }}>{'>'}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 6 }}>Swipe smarter. Pay later.</Text>
          </View>

          {/* Heading */}
          <Text style={{ fontSize: 28, fontWeight: '600', color: '#1C1C1E', marginBottom: 32 }}>Sign in</Text>

          {/* Form */}
          <View style={{ gap: 20 }}>

            {/* Email */}
            <View>
              <Text style={{
                fontSize: 11, fontWeight: '600', color: '#8E8E93',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 4,
              }}>
                Email
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F2F2F7', borderRadius: 8, height: 48,
                  paddingHorizontal: 16, fontSize: 16, color: '#1C1C1E',
                }}
                placeholder="you@example.com"
                placeholderTextColor="#C7C7CC"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <View>
              <Text style={{
                fontSize: 11, fontWeight: '600', color: '#8E8E93',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 4,
              }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    backgroundColor: '#F2F2F7', borderRadius: 8, height: 48,
                    paddingHorizontal: 16, paddingRight: 48, fontSize: 16, color: '#1C1C1E',
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#C7C7CC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: 12,
                  }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={22}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#0A84FF', borderRadius: 8, height: 48,
              alignItems: 'center', justifyContent: 'center', marginTop: 32,
            }}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Sign in</Text>
            }
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#8E8E93', fontSize: 15 }}>Don't have an account? </Text>
            <Link href="/(auth)/register">
              <Text style={{ color: '#0A84FF', fontSize: 15, fontWeight: '600' }}>Sign up</Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
