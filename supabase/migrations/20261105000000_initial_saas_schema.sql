-- =============================================================================
-- Extrato de Estudos SaaS — Schema Inicial PostgreSQL + Row Level Security (Supabase)
-- =============================================================================

-- 1. Tabela de Perfis e Controle de Assinatura
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'mentor')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (
    subscription_status IN ('inactive', 'trialing', 'active', 'past_due', 'canceled')
  ),
  subscription_period_end TIMESTAMPTZ,
  abacatepay_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Estado Sincronizado do Estudante (Documento Canônico Validado)
CREATE TABLE IF NOT EXISTS public.user_study_states (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL,
  state_json JSONB NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  device_id TEXT,
  client_updated_at TIMESTAMPTZ NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Histórico de Snapshots na Nuvem (Proteção Anti-Corrupção / Rollback)
CREATE TABLE IF NOT EXISTS public.user_state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL,
  state_json JSONB NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'auto_weekly' CHECK (reason IN ('auto_weekly', 'pre_import', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Registro Auditável de Cobranças PIX (AbacatePay)
CREATE TABLE IF NOT EXISTS public.billing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_billing_id TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('pro_monthly', 'pro_annual')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'CANCELED', 'REFUNDED')),
  checkout_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Trigger Automática: Cria perfil 'free' sempre que um usuário se cadastra
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan_tier, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    'inactive'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_study_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_state_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_orders ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário lê apenas seu próprio perfil (atualização de plano restrita à service_role via Webhook)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- User Study States: leitura e gravação restritas ao próprio titular com assinatura Pro ativa
CREATE POLICY "study_states_select_own"
  ON public.user_study_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "study_states_upsert_own"
  ON public.user_study_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_states_update_own"
  ON public.user_study_states FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Snapshots: leitura restrita ao próprio usuário
CREATE POLICY "snapshots_select_own"
  ON public.user_state_snapshots FOR SELECT
  USING (auth.uid() = user_id);

-- Billing Orders: leitura restrita ao próprio usuário
CREATE POLICY "billing_orders_select_own"
  ON public.billing_orders FOR SELECT
  USING (auth.uid() = user_id);
