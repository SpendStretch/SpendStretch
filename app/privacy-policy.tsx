import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const EFFECTIVE_DATE = 'April 5, 2025';
const CONTACT_EMAIL = 'privacy@spendstretch.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 14, color: '#3A3A3C', lineHeight: 22 }}>{children}</Text>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 4 }}>
      <Text style={{ fontSize: 14, color: '#3A3A3C', marginRight: 8 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 14, color: '#3A3A3C', lineHeight: 22 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, height: 56,
        borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#1C1C1E', marginLeft: 8 }}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 }}>Privacy Policy</Text>
        <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 32 }}>Effective date: {EFFECTIVE_DATE}</Text>

        <Section title="1. Overview">
          <Body>
            SpendStretch ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the SpendStretch mobile application.
          </Body>
        </Section>

        <Section title="2. Information We Collect">
          <Body>We collect the following types of information:</Body>
          <View style={{ marginTop: 8 }}>
            <Bullet>Account information: email address and display name when you register</Bullet>
            <Bullet>Credit card metadata: card name, bank name, last 4 digits of card number, statement close day, payment due day, credit limit, and card owner name</Bullet>
            <Bullet>Billing cycle data: statement balances, minimum payments, payment due dates, and payment status</Bullet>
            <Bullet>Uploaded PDF statements: when you use the "Upload Statement" feature, the PDF is temporarily processed to extract card information and is not stored on our servers</Bullet>
            <Bullet>Notification preferences: your reminder settings</Bullet>
          </View>
        </Section>

        <Section title="3. How We Use Your Information">
          <Body>We use your information solely to provide the SpendStretch service:</Body>
          <View style={{ marginTop: 8 }}>
            <Bullet>To calculate and display card float scores and payment recommendations</Bullet>
            <Bullet>To track your billing cycles and send payment reminders</Bullet>
            <Bullet>To pre-fill card details from uploaded PDF statements using AI processing</Bullet>
            <Bullet>To maintain your account and preferences</Bullet>
          </View>
          <View style={{ marginTop: 8 }}>
            <Body>We do not sell, rent, or share your personal information with third parties for marketing purposes.</Body>
          </View>
        </Section>

        <Section title="4. AI Statement Processing">
          <Body>
            When you upload a credit card statement PDF, its contents are sent to Anthropic's Claude API for text extraction. The PDF data is used only to extract card details (card name, bank, dates, balances) and is not stored by us or used to train AI models. Anthropic's processing is governed by their own privacy policy. We recommend against uploading documents containing sensitive information beyond standard statement details.
          </Body>
        </Section>

        <Section title="5. Data Storage and Security">
          <Body>
            Your data is stored securely using Supabase, a cloud database provider with industry-standard encryption at rest and in transit (TLS/SSL). Access to your data is protected by Row Level Security — only you can access your own card and payment data. We do not store full credit card numbers, CVV codes, or bank login credentials.
          </Body>
        </Section>

        <Section title="6. Data Retention">
          <Body>
            We retain your data for as long as your account is active. You may delete your account at any time from the Settings screen, which permanently removes all your card and payment data from our systems.
          </Body>
        </Section>

        <Section title="7. Push Notifications">
          <Body>
            If you enable payment reminders, we may send push notifications to your device before payment due dates. You can disable notifications at any time in the app Settings or your device's notification settings. We do not use notifications for marketing.
          </Body>
        </Section>

        <Section title="8. Children's Privacy">
          <Body>
            SpendStretch is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
          </Body>
        </Section>

        <Section title="9. Your Rights">
          <Body>You have the right to:</Body>
          <View style={{ marginTop: 8 }}>
            <Bullet>Access the personal data we hold about you</Bullet>
            <Bullet>Correct inaccurate data via the app's edit features</Bullet>
            <Bullet>Delete your account and all associated data via Settings</Bullet>
            <Bullet>Export your data by contacting us at the email below</Bullet>
          </View>
        </Section>

        <Section title="10. Third-Party Services">
          <Body>SpendStretch uses the following third-party services:</Body>
          <View style={{ marginTop: 8 }}>
            <Bullet>Supabase — database and authentication (supabase.com/privacy)</Bullet>
            <Bullet>Anthropic Claude — AI statement parsing (anthropic.com/privacy)</Bullet>
            <Bullet>Expo / React Native — mobile app platform</Bullet>
          </View>
        </Section>

        <Section title="11. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. We will notify you of material changes by updating the effective date at the top of this page. Continued use of the app after changes constitutes acceptance of the updated policy.
          </Body>
        </Section>

        <Section title="12. Contact Us">
          <Body>
            If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
          </Body>
          <Text style={{ fontSize: 14, color: '#0A84FF', marginTop: 8 }}>{CONTACT_EMAIL}</Text>
        </Section>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#C7C7CC', marginTop: 16 }}>
          SpendStretch. Swipe smarter. Pay later.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
