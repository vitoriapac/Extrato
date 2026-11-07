-- =============================================================================
-- Paywall no banco (RLS) + liquidação atômica de pedidos
-- =============================================================================

-- Mesma regra de state-sync: pro/mentor, active/trialing, período não vencido.
CREATE OR REPLACE FUNCTION public.has_active_pro(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid
      AND p.plan_tier IN ('pro', 'mentor')
      AND p.subscription_status IN ('active', 'trialing')
      AND (p.subscription_period_end IS NULL OR p.subscription_period_end > now())
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_pro(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_pro(UUID) TO authenticated, service_role;

-- SELECT segue livre para o titular (permite baixar dados após expirar).
DROP POLICY IF EXISTS "study_states_upsert_own" ON public.user_study_states;
DROP POLICY IF EXISTS "study_states_update_own" ON public.user_study_states;
DROP POLICY IF EXISTS "study_states_insert_pro" ON public.user_study_states;
DROP POLICY IF EXISTS "study_states_update_pro" ON public.user_study_states;

CREATE POLICY "study_states_insert_pro"
  ON public.user_study_states FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_active_pro(auth.uid()));

CREATE POLICY "study_states_update_pro"
  ON public.user_study_states FOR UPDATE
  USING (auth.uid() = user_id AND public.has_active_pro(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_pro(auth.uid()));

-- Limites de tamanho (5 MB) e versão. NOT VALID: não reprova linhas antigas, vale para novas.
ALTER TABLE public.user_study_states
  ADD CONSTRAINT user_study_states_state_size CHECK (octet_length(state_json::text) <= 5242880) NOT VALID,
  ADD CONSTRAINT user_study_states_schema_version CHECK (schema_version BETWEEN 1 AND 1000) NOT VALID;

-- Cinto e suspensório: só service_role escreve nestas tabelas.
REVOKE INSERT, UPDATE, DELETE ON public.profiles, public.billing_orders, public.user_state_snapshots
  FROM anon, authenticated;

-- Liquidação atômica e idempotente: só o primeiro PENDING->PAID estende o plano.
CREATE OR REPLACE FUNCTION public.settle_billing_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order public.billing_orders%ROWTYPE;
BEGIN
  UPDATE public.billing_orders
     SET status = 'PAID', paid_at = now()
   WHERE id = p_order_id AND status = 'PENDING'
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
     SET plan_tier = 'pro',
         subscription_status = 'active',
         subscription_period_end = now() + (CASE v_order.plan_id WHEN 'pro_monthly' THEN 31 ELSE 366 END) * INTERVAL '1 day',
         updated_at = now()
   WHERE id = v_order.user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_billing_order(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_billing_order(UUID) TO service_role;
