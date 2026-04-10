import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { CardFormData } from '@/lib/types';
import CardForm from '@/components/CardForm';
import { getNextCloseDate, getPaymentDueDate } from '@/lib/float';
import { pickAndParseStatement, parsedToFormData } from '@/lib/parseStatement';

export default function AddCardScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [hasCards, setHasCards] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<CardFormData>>({});
  const [formKey, setFormKey] = useState(0);
  const [activeMode, setActiveMode] = useState<'form' | 'upload'>('form');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingProfile(false); return; }

      const [profileRes, cardsRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('id', user.id).single(),
        supabase.from('cards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      if (profileRes.data) setDisplayName(profileRes.data.display_name);
      if ((cardsRes.count ?? 0) > 0) setHasCards(true);
      setLoadingProfile(false);
    }
    loadData();
  }, []);

  async function handleUploadStatement() {
    setParsing(true);
    setActiveMode('upload');
    try {
      const { parsed, fileName } = await pickAndParseStatement();
      setInitialFormData(parsedToFormData(parsed));
      setFormKey(k => k + 1);
      setParsedFileName(fileName);
    } catch (err: any) {
      if (err.message !== 'CANCELLED') {
        Alert.alert('Could not read statement', err.message ?? 'Please try again or fill the form manually.');
      }
      setActiveMode('form');
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(form: CardFormData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cardData, error } = await supabase.from('cards').insert({
      user_id: user.id,
      card_name: form.card_name.trim(),
      bank_name: form.bank_name.trim(),
      last_four: form.last_four.trim() || null,
      card_owner: form.card_owner.trim() || displayName,
      statement_close_day: form.statement_close_day,
      payment_due_day: form.payment_due_day,
      credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      card_type: form.card_type,
      is_active: true,
    }).select().single();

    if (error) { Alert.alert('Error', error.message); return; }

    const balance = parseFloat(form.statement_balance ?? '') || 0;
    if (cardData && balance > 0) {
      const nextClose = getNextCloseDate(cardData);
      const dueDate = getPaymentDueDate(cardData);
      await supabase.from('billing_cycles').insert({
        card_id: cardData.id,
        user_id: user.id,
        statement_close_date: nextClose.toISOString().split('T')[0],
        payment_due_date: dueDate.toISOString().split('T')[0],
        statement_balance: balance,
        minimum_payment: parseFloat(form.minimum_payment ?? '') || 0,
        amount_paid: 0,
        is_paid: false,
        is_minimum_only: form.is_minimum_only ?? false,
      });
    }

    router.back();
  }

  if (loadingProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0A84FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#1C1C1E', marginLeft: 8 }}>Add card</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 26, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.3 }}>
            {hasCards ? 'Add a card' : 'Add your first card'}
          </Text>
          <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 6 }}>
            We just need a few details to calculate your optimal card.
          </Text>
        </View>

        {/* Option cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          {/* Fill out form */}
          <TouchableOpacity
            style={{
              flex: 1, padding: 16, borderRadius: 12,
              backgroundColor: activeMode === 'form' ? '#E8F4FD' : '#FFFFFF',
              borderWidth: activeMode === 'form' ? 2 : 1,
              borderColor: activeMode === 'form' ? '#0A84FF' : '#E5E5EA',
            }}
            activeOpacity={0.7}
            onPress={() => setActiveMode('form')}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: activeMode === 'form' ? 'rgba(10,132,255,0.1)' : '#F2F2F7',
              alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>
              <MaterialIcons name="edit" size={20} color={activeMode === 'form' ? '#0A84FF' : '#8E8E93'} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}>Fill out form</Text>
            <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '500', marginTop: 2 }}>Takes 30 seconds</Text>
          </TouchableOpacity>

          {/* Upload statement */}
          <TouchableOpacity
            style={{
              flex: 1, padding: 16, borderRadius: 12,
              backgroundColor: activeMode === 'upload' ? '#E8F4FD' : '#FFFFFF',
              borderWidth: activeMode === 'upload' ? 2 : 1,
              borderColor: activeMode === 'upload' ? '#0A84FF' : '#E5E5EA',
              opacity: parsing ? 0.7 : 1,
            }}
            activeOpacity={0.7}
            onPress={handleUploadStatement}
            disabled={parsing}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: activeMode === 'upload' ? 'rgba(10,132,255,0.1)' : '#F2F2F7',
              alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>
              {parsing
                ? <ActivityIndicator size="small" color="#0A84FF" />
                : <MaterialIcons name="upload-file" size={20} color={activeMode === 'upload' ? '#0A84FF' : '#8E8E93'} />
              }
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}>Upload statement</Text>
            <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '500', marginTop: 2 }}>
              {parsing ? 'Reading PDF...' : "We'll read it for you"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Parsed confirmation banner */}
        {parsedFileName && !parsing && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0',
            paddingHorizontal: 12, paddingVertical: 10, marginBottom: 20,
          }}>
            <MaterialIcons name="check-circle" size={16} color="#34C759" />
            <Text style={{ flex: 1, fontSize: 13, color: '#1C1C1E' }}>
              Pre-filled from <Text style={{ fontWeight: '600' }}>{parsedFileName}</Text>
            </Text>
            <TouchableOpacity onPress={() => {
              setParsedFileName(null);
              setInitialFormData({});
              setFormKey(k => k + 1);
              setActiveMode('form');
            }}>
              <MaterialIcons name="close" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        )}

        {/* Parsing overlay */}
        {parsing && (
          <View style={{
            alignItems: 'center', paddingVertical: 32, gap: 12,
            backgroundColor: '#F2F2F7', borderRadius: 12, marginBottom: 20,
          }}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1C1C1E' }}>Reading your statement</Text>
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>Claude is extracting your card details…</Text>
          </View>
        )}

        {/* Form */}
        {!parsing && (
          <CardForm
            key={formKey}
            initialData={{ ...initialFormData, card_owner: initialFormData.card_owner || displayName }}
            defaultOwnerName={displayName}
            onSubmit={handleSubmit}
            submitLabel="Add card"
            showCycleFields
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
