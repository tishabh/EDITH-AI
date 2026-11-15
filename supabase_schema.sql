-- ==============================================================================
-- AETHER // LIQUID GLASS AI - SUPABASE SCHEMA & SECURITY POLICIES (IDEMPOTENT)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create CHATS Table
CREATE TABLE IF NOT EXISTS public.chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  model TEXT DEFAULT 'meta/llama-3.3-70b-instruct',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create MESSAGES Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT DEFAULT 'meta/llama-3.3-70b-instruct',
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create SYSTEM SETTINGS Table (Admin Config)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_model TEXT DEFAULT 'meta/llama-3.3-70b-instruct',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  system_announcement TEXT DEFAULT '✨ Welcome to AETHER // Liquid Glass AI powered by NVIDIA NIM & Supabase!',
  announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success')),
  max_tokens_limit INTEGER DEFAULT 4096,
  temperature_default NUMERIC(3, 2) DEFAULT 0.70,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial default settings if empty
INSERT INTO public.system_settings (id, default_model, maintenance_mode, system_announcement, announcement_type)
VALUES (1, 'meta/llama-3.3-70b-instruct', FALSE, '✨ Welcome to AETHER // Liquid Glass AI powered by NVIDIA NIM & Supabase!', 'info')
ON CONFLICT (id) DO NOTHING;

-- 5. Create API USAGE LOGS Table (Telemetry & Analytics)
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT 'anonymous',
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is the designated administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'sharmasrishabh157@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Chats Policies
DROP POLICY IF EXISTS "Users can view own chats or admin view all" ON public.chats;
CREATE POLICY "Users can view own chats or admin view all"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own chats" ON public.chats;
CREATE POLICY "Users can insert own chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
CREATE POLICY "Users can update own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
CREATE POLICY "Users can delete own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- Messages Policies
DROP POLICY IF EXISTS "Users can view messages from their chats or admin view all" ON public.messages;
CREATE POLICY "Users can view messages from their chats or admin view all"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id AND (chats.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;
CREATE POLICY "Users can insert messages to their chats"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id AND (chats.user_id = auth.uid() OR public.is_admin())
    )
  );

-- System Settings Policies
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admin can update system settings" ON public.system_settings;
CREATE POLICY "Only admin can update system settings"
  ON public.system_settings FOR UPDATE
  USING (public.is_admin());

-- API Usage Logs Policies
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.api_usage_logs;
CREATE POLICY "Anyone can insert logs"
  ON public.api_usage_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admin can view usage logs" ON public.api_usage_logs;
CREATE POLICY "Only admin can view usage logs"
  ON public.api_usage_logs FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN LOWER(NEW.email) = 'sharmasrishabh157@gmail.com' THEN 'admin' ELSE 'user' END,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
