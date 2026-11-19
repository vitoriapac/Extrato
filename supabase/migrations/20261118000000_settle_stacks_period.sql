-- Renovar antes de vencer soma os dias que ainda restam (igual a admin_extend_subscription).
-- Antes: subscription_period_end = now() + 31/366 dias, o que descartava os dias restantes.
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
         -- Só soma sobre um Pro ativo. Depois de reembolso o vencimento antigo continua gravado
         -- e não pode render dias na compra seguinte.
         subscription_period_end = (CASE
             WHEN plan_tier IN ('pro', 'mentor') AND subscription_status = 'active'
               THEN GREATEST(now(), COALESCE(subscription_period_end, now()))
             ELSE now()
           END)
           + (CASE v_order.plan_id WHEN 'pro_monthly' THEN 31 ELSE 366 END) * INTERVAL '1 day',
         updated_at = now()
   WHERE id = v_order.user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_billing_order(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_billing_order(UUID) TO service_role;
