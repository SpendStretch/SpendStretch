-- SpendStretch initial schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notification_days_before INTEGER[] DEFAULT '{1, 3}'
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  last_four TEXT,
  card_owner TEXT NOT NULL DEFAULT '',
  statement_close_day INTEGER NOT NULL CHECK (statement_close_day BETWEEN 1 AND 31),
  payment_due_day INTEGER NOT NULL CHECK (payment_due_day BETWEEN 1 AND 31),
  credit_limit NUMERIC(12,2),
  is_active BOOLEAN DEFAULT true,
  card_type TEXT DEFAULT 'personal' CHECK (card_type IN ('personal', 'business')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Billing cycles table
CREATE TABLE IF NOT EXISTS billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  statement_close_date DATE NOT NULL,
  payment_due_date DATE NOT NULL,
  statement_balance NUMERIC(12,2) DEFAULT 0,
  minimum_payment NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  is_minimum_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users see own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- Cards policies
CREATE POLICY "Users see own cards"
  ON cards FOR ALL
  USING (user_id = auth.uid());

-- Billing cycles policies
CREATE POLICY "Users see own cycles"
  ON billing_cycles FOR ALL
  USING (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Storage bucket for PDF statements (run manually in Supabase dashboard if not already created)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', false);

-- Storage RLS: users can only access their own uploads
-- CREATE POLICY "User statement uploads" ON storage.objects FOR ALL
--   USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);
