import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CardFormData, BANK_NAMES, CardType } from '@/lib/types';

interface Props {
  initialData?: Partial<CardFormData>;
  defaultOwnerName?: string;
  onSubmit: (data: CardFormData) => Promise<void>;
  submitLabel: string;
  showCycleFields?: boolean;
}

const DEFAULT_DATA: CardFormData = {
  card_name: '',
  bank_name: '',
  last_four: '',
  card_owner: '',
  statement_close_day: 1,
  payment_due_day: 25,
  credit_limit: '',
  card_type: 'personal',
  statement_balance: '',
  minimum_payment: '',
  is_minimum_only: false,
};

const LABEL_STYLE = {
  fontSize: 11, fontWeight: '600' as const, color: '#8E8E93',
  textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6, marginLeft: 4,
};

const INPUT_STYLE = {
  backgroundColor: '#F2F2F7', borderRadius: 8, height: 48,
  paddingHorizontal: 16, fontSize: 16, color: '#1C1C1E',
};

function DayPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          ...INPUT_STYLE, justifyContent: 'space-between',
          flexDirection: 'row', alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, color: '#1C1C1E', fontVariant: ['tabular-nums'] }}>{value}</Text>
        <MaterialIcons name="expand-more" size={20} color="#8E8E93" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 320, paddingBottom: 32 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1C1C1E' }}>Select day</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ color: '#0A84FF', fontSize: 17, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={days}
            keyExtractor={(d) => String(d)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onChange(item); setOpen(false); }}
                style={{ paddingVertical: 14, paddingHorizontal: 24, backgroundColor: item === value ? '#E8F4FD' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 16, color: item === value ? '#0A84FF' : '#1C1C1E', fontWeight: item === value ? '600' : '400' }}>{item}</Text>
                {item === value && <MaterialIcons name="check" size={18} color="#0A84FF" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

function BankPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = BANK_NAMES.filter(b =>
    b.toLowerCase().includes(search.toLowerCase())
  );
  const showCustomOption =
    search.trim().length > 0 &&
    !BANK_NAMES.some(b => b.toLowerCase() === search.trim().toLowerCase());

  return (
    <>
      {/* Text input row — type freely or open picker */}
      <View style={{ ...INPUT_STYLE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 }}>
        <TextInput
          style={{ flex: 1, fontSize: 16, color: '#1C1C1E', paddingHorizontal: 16 }}
          placeholder="e.g. Chase"
          placeholderTextColor="#C7C7CC"
          value={value}
          onChangeText={onChange}
        />
        <TouchableOpacity
          onPress={() => { setSearch(''); setOpen(true); }}
          style={{ paddingRight: 14, paddingLeft: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="expand-more" size={22} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Searchable bank list modal */}
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 480, paddingBottom: 32 }}>
          {/* Header */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1C1C1E' }}>Select bank</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ color: '#0A84FF', fontSize: 17, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          {/* Search input */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
            <View style={{ backgroundColor: '#F2F2F7', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40 }}>
              <MaterialIcons name="search" size={18} color="#8E8E93" />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#1C1C1E', marginLeft: 8 }}
                placeholder="Search or type bank name"
                placeholderTextColor="#C7C7CC"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialIcons name="close" size={16} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Bank list */}
          <FlatList
            data={filtered}
            keyExtractor={(b) => b}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onChange(item); setOpen(false); }}
                style={{ paddingVertical: 14, paddingHorizontal: 24, backgroundColor: item === value ? '#E8F4FD' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 16, color: item === value ? '#0A84FF' : '#1C1C1E', fontWeight: item === value ? '600' : '400' }}>{item}</Text>
                {item === value && <MaterialIcons name="check" size={18} color="#0A84FF" />}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              showCustomOption ? (
                <TouchableOpacity
                  onPress={() => { onChange(search.trim()); setOpen(false); }}
                  style={{ paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <MaterialIcons name="add-circle-outline" size={20} color="#0A84FF" />
                  <Text style={{ fontSize: 16, color: '#0A84FF' }}>Use "{search.trim()}"</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      </Modal>
    </>
  );
}

export default function CardForm({ initialData, defaultOwnerName = '', onSubmit, submitLabel, showCycleFields = false }: Props) {
  const [form, setForm] = useState<CardFormData>({ ...DEFAULT_DATA, card_owner: defaultOwnerName, ...initialData });
  const [loading, setLoading] = useState(false);

  function update(field: keyof CardFormData, value: string | number | CardType) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.card_name.trim()) { return; }
    if (!form.bank_name.trim()) { return; }
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  return (
    <View style={{ gap: 20, paddingBottom: 16 }}>

      {/* Card type toggle */}
      <View style={{ flexDirection: 'row', padding: 4, backgroundColor: '#F2F2F7', borderRadius: 12 }}>
        {(['personal', 'business'] as CardType[]).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => update('card_type', type)}
            style={{
              flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
              backgroundColor: form.card_type === type ? '#0A84FF' : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 14, fontWeight: '600',
              color: form.card_type === type ? '#FFFFFF' : '#8E8E93',
              textTransform: 'capitalize',
            }}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Card name */}
      <View>
        <Text style={LABEL_STYLE}>Card name</Text>
        <TextInput
          style={INPUT_STYLE}
          placeholder="e.g. Sapphire Reserve"
          placeholderTextColor="#C7C7CC"
          value={form.card_name}
          onChangeText={(v) => update('card_name', v)}
        />
      </View>

      {/* Bank */}
      <View>
        <Text style={LABEL_STYLE}>Bank</Text>
        <BankPicker value={form.bank_name} onChange={(v) => update('bank_name', v)} />
      </View>

      {/* Last 4 + Card owner */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={LABEL_STYLE}>Last 4 digits</Text>
          <TextInput
            style={{ ...INPUT_STYLE, fontVariant: ['tabular-nums'] }}
            placeholder="1234"
            placeholderTextColor="#C7C7CC"
            value={form.last_four}
            onChangeText={(v) => update('last_four', v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={LABEL_STYLE}>Card owner</Text>
          <TextInput
            style={INPUT_STYLE}
            placeholder="Your name"
            placeholderTextColor="#C7C7CC"
            value={form.card_owner}
            onChangeText={(v) => update('card_owner', v)}
          />
        </View>
      </View>

      {/* Closing day + Due day */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={LABEL_STYLE}>Closing day</Text>
          <DayPicker value={form.statement_close_day} onChange={(v) => update('statement_close_day', v)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={LABEL_STYLE}>Due day</Text>
          <DayPicker value={form.payment_due_day} onChange={(v) => update('payment_due_day', v)} />
        </View>
      </View>

      {/* Credit limit */}
      <View>
        <Text style={LABEL_STYLE}>Credit limit (optional)</Text>
        <View style={{ position: 'relative' }}>
          <Text style={{ position: 'absolute', left: 16, top: 15, fontSize: 16, color: '#8E8E93', zIndex: 1 }}>$</Text>
          <TextInput
            style={{ ...INPUT_STYLE, paddingLeft: 28, fontVariant: ['tabular-nums'] }}
            placeholder="5,000"
            placeholderTextColor="#C7C7CC"
            value={form.credit_limit}
            onChangeText={(v) => update('credit_limit', v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Statement balance + minimum payment */}
      {showCycleFields && (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={LABEL_STYLE}>Statement balance</Text>
              <View style={{ position: 'relative' }}>
                <Text style={{ position: 'absolute', left: 16, top: 15, fontSize: 16, color: '#8E8E93', zIndex: 1 }}>$</Text>
                <TextInput
                  style={{ ...INPUT_STYLE, paddingLeft: 28, fontVariant: ['tabular-nums'] }}
                  placeholder="0.00"
                  placeholderTextColor="#C7C7CC"
                  value={form.statement_balance}
                  onChangeText={(v) => update('statement_balance', v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={LABEL_STYLE}>Minimum payment</Text>
              <View style={{ position: 'relative' }}>
                <Text style={{ position: 'absolute', left: 16, top: 15, fontSize: 16, color: '#8E8E93', zIndex: 1 }}>$</Text>
                <TextInput
                  style={{ ...INPUT_STYLE, paddingLeft: 28, fontVariant: ['tabular-nums'] }}
                  placeholder="25.00"
                  placeholderTextColor="#C7C7CC"
                  value={form.minimum_payment}
                  onChangeText={(v) => update('minimum_payment', v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => update('is_minimum_only', !form.is_minimum_only)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Switch
              value={form.is_minimum_only ?? false}
              onValueChange={(v) => update('is_minimum_only', v)}
              trackColor={{ false: '#E5E5EA', true: '#0A84FF' }}
              thumbColor="#fff"
            />
            <Text style={{ fontSize: 14, color: '#8E8E93', fontWeight: '500', flex: 1 }}>
              I am making minimum payments only on this card
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{ backgroundColor: '#0A84FF', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
        activeOpacity={0.9}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{submitLabel}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}
