-- =============================================================================
-- Migration: Painel de Administração e Backoffice SaaS (Fase 8 SaaS)
-- Adiciona roles, trilha de auditoria (admin_audit_logs) e RPCs de suporte
-- =============================================================================

-- 1. Estende a tabela public.profiles com role e aceite de termos
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- 2. Tabela de Trilha de Auditoria Administrativa Imutável
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id TEXT NOT NULL,
  target_user_id TEXT,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta para o Backoffice
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON public.admin_audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user ON public.admin_audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- 3. Função auxiliar para verificar permissão de Administrador
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;

-- 4. RLS para admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas administradores autenticados ou a service_role podem consultar os logs de auditoria
CREATE POLICY "admin_audit_logs_select_admin_only"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Escrita de auditoria restrita exclusivamente à service_role
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_logs FROM anon, authenticated;

-- 5. RPC Atômica para Concessão ou Extensão Manual de Assinatura pelo Admin
CREATE OR REPLACE FUNCTION public.admin_extend_subscription(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_days INTEGER,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_end TIMESTAMPTZ;
  v_new_end TIMESTAMPTZ;
BEGIN
  -- Valida se o operador é administrador
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Acesso negado: operador não possui privilégios de administrador.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Motivo da concessão/extensão é obrigatório para auditoria.';
  END IF;

  IF p_days <= 0 THEN
    RAISE EXCEPTION 'Quantidade de dias adicionais deve ser maior que zero.';
  END IF;

  SELECT subscription_period_end INTO v_current_end
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  -- Se já estiver ativo no futuro, adiciona a partir de lá; senão, a partir de agora
  IF v_current_end IS NOT NULL AND v_current_end > now() THEN
    v_new_end := v_current_end + (p_days || ' days')::INTERVAL;
  ELSE
    v_new_end := now() + (p_days || ' days')::INTERVAL;
  END IF;

  UPDATE public.profiles
  SET
    plan_tier = 'pro',
    subscription_status = 'active',
    subscription_period_end = v_new_end,
    updated_at = now()
  WHERE id = p_target_user_id;

  -- Grava na trilha de auditoria
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    target_user_id,
    action,
    reason,
    metadata
  ) VALUES (
    p_admin_id::text,
    p_target_user_id::text,
    'subscription_extended',
    p_reason,
    jsonb_build_object(
      'days_added', p_days,
      'previous_end', v_current_end,
      'new_end', v_new_end
    )
  );

  RETURN TRUE;
END;
$$;

-- 6. RPC Atômica para Alteração de Role do Usuário (Promoção/Rebaixamento)
CREATE OR REPLACE FUNCTION public.admin_change_role(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_new_role TEXT,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old_role TEXT;
BEGIN
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Acesso negado: operador não possui privilégios de administrador.';
  END IF;

  IF p_new_role NOT IN ('student', 'mentor', 'admin') THEN
    RAISE EXCEPTION 'Role inválido: escolha entre student, mentor ou admin.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Motivo da alteração de papel é obrigatório para auditoria.';
  END IF;

  SELECT role INTO v_old_role
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role, updated_at = now()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    target_user_id,
    action,
    reason,
    metadata
  ) VALUES (
    p_admin_id::text,
    p_target_user_id::text,
    'role_changed',
    p_reason,
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_new_role
    )
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_extend_subscription(UUID, UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_extend_subscription(UUID, UUID, INTEGER, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_change_role(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_change_role(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;
