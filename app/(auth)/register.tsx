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
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!displayName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName,
      });
    }
    setLoading(false);
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
        {/* Back button */}
        <View style={{ paddingHorizontal: 8, paddingTop: Platform.OS === 'ios' ? 56 : 16, height: 64, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#0A84FF" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>

          {/* Heading */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.3 }}>
              Create your account
            </Text>
            <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 8 }}>
              Join SpendStretch to master your finances.
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 20 }}>

            {/* Name */}
            <View>
              <Text style={{
                fontSize: 11, fontWeight: '600', color: '#8E8E93',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 4,
              }}>
                Your name
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F2F2F7', borderRadius: 8, height: 48,
                  paddingHorizontal: 16, fontSize: 16, color: '#1C1C1E',
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#C7C7CC"
                value={displayName}
                onChangeText={setDisplayName}
                autoComplete="name"
              />
            </View>

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
                placeholder="example@email.com"
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
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#C7C7CC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: 12 }}
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

          {/* Create account button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#0A84FF', borderRadius: 8, height: 48,
              alignItems: 'center', justifyContent: 'center', marginTop: 32,
            }}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Create account</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 28 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
            <Text style={{ paddingHorizontal: 16, color: '#8E8E93', fontSize: 12, fontWeight: '500' }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
          </View>

          {/* Social buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={{
                height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="g-translate" size={20} color="#4285F4" />
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1C1C1E' }}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="apple" size={20} color="#1C1C1E" />
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1C1C1E' }}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: '#8E8E93', fontSize: 15 }}>Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={{ color: '#0A84FF', fontSize: 15, fontWeight: '600' }}>Sign in</Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
