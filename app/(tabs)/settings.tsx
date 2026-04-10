import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import Constants from 'expo-constants';

const REMINDER_OPTIONS = [
  { label: '1 day before', value: 1 },
  { label: '3 days before', value: 3 },
  { label: '7 days before', value: 7 },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
      {title}
    </Text>
  );
}

function SettingsRow({ label, sublabel, last = false, children, onPress, destructive = false }: {
  label: string; sublabel?: string; last?: boolean; children?: React.ReactNode; onPress?: () => void; destructive?: boolean;
}) {
  const inner = (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: '#F2F2F7', minHeight: 52,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: destructive ? '#FF3B30' : '#1C1C1E' }}>{label}</Text>
        {sublabel && <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>{sublabel}</Text>}
      </View>
      {children}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  }
  return inner;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState<number[]>([1, 3]);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data as Profile);
      setDisplayName(data.display_name);
      setReminderDays(data.notification_days_before ?? [1, 3]);
    }
    setLoading(false);
  }

  async function handleSaveName() {
    if (!profile || !displayName.trim()) return;
    setSavingName(true);
    await supabase.from('profiles').update({ display_name: displayName.trim(), updated_at: new Date().toISOString() }).eq('id', profile.id);
    setSavingName(false);
    setEditingName(false);
    loadProfile();
  }

  async function toggleReminderDay(day: number) {
    const next = reminderDays.includes(day)
      ? reminderDays.filter((d) => d !== day)
      : [...reminderDays, day].sort((a, b) => a - b);
    setReminderDays(next);
    if (profile) {
      await supabase.from('profiles').update({ notification_days_before: next, updated_at: new Date().toISOString() }).eq('id', profile.id);
    }
  }

  async function handleEnableNotifications(enabled: boolean) {
    setNotificationsEnabled(enabled);
    if (enabled) {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        Alert.alert('Permission denied', 'Enable notifications in your device settings to receive payment reminders.');
        setNotificationsEnabled(false);
      }
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert('Delete account', 'This permanently deletes your account and all your card data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account', style: 'destructive',
        onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('profiles').delete().eq('id', user.id);
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0A84FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 28 }}>Settings</Text>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden', marginBottom: 24 }}>
          <SettingsRow label="Payment reminders" sublabel="Get notified before payments are due">
            <Switch value={notificationsEnabled} onValueChange={handleEnableNotifications} trackColor={{ false: '#E5E5EA', true: '#34C759' }} thumbColor="#fff" />
          </SettingsRow>
          {notificationsEnabled && REMINDER_OPTIONS.map((opt, i) => (
            <SettingsRow key={opt.value} label={opt.label} last={i === REMINDER_OPTIONS.length - 1}>
              <Switch
                value={reminderDays.includes(opt.value)}
                onValueChange={() => toggleReminderDay(opt.value)}
                trackColor={{ false: '#E5E5EA', true: '#0A84FF' }}
                thumbColor="#fff"
              />
            </SettingsRow>
          ))}
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden', marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Display name</Text>
            {editingName ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#F2F2F7', borderRadius: 8, height: 40, paddingHorizontal: 12, fontSize: 16, color: '#1C1C1E' }}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName} disabled={savingName}>
                  {savingName ? <ActivityIndicator color="#0A84FF" size="small" /> : <Text style={{ color: '#0A84FF', fontSize: 16, fontWeight: '600' }}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setDisplayName(profile?.display_name ?? ''); }}>
                  <Text style={{ color: '#8E8E93', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#1C1C1E', fontWeight: '500' }}>{profile?.display_name}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <Text style={{ color: '#0A84FF', fontSize: 15 }}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <SettingsRow label="Sign out" destructive onPress={handleSignOut}>
            <MaterialIcons name="logout" size={18} color="#FF3B30" />
          </SettingsRow>
          <SettingsRow label="Delete account" destructive last onPress={handleDeleteAccount}>
            <MaterialIcons name="delete-outline" size={18} color="#FF3B30" />
          </SettingsRow>
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden', marginBottom: 24 }}>
          <SettingsRow label="Version" last={false}>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontVariant: ['tabular-nums'] }}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </SettingsRow>
          <SettingsRow label="Privacy policy" onPress={() => router.push('/privacy-policy')} last={false}>
            <MaterialIcons name="chevron-right" size={18} color="#C7C7CC" />
          </SettingsRow>
          <SettingsRow label="Terms of service" onPress={() => {}} last>
            <MaterialIcons name="open-in-new" size={16} color="#0A84FF" />
          </SettingsRow>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#C7C7CC', marginTop: 8 }}>
          SpendStretch. Swipe smarter. Pay later.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
