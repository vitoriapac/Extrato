-- =============================================================================
-- Colunas de cobrança que as edge functions já usam e nenhuma migration criava
-- =============================================================================
-- abacatepay-checkout grava payment_method/installments em billing_orders;
-- abacatepay-webhook grava fee_cents/failure_reason em billing_orders e
-- auto_renew/card_brand/card_last4/cancel_at_period_end/payment_method em profiles.
-- Sem elas todo checkout falhava no insert. IF NOT EXISTS: bancos que já as
-- receberam à mão não quebram.

ALTER TABLE public.billing_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('pix', 'card')),
  ADD COLUMN IF NOT EXISTS installments INTEGER CHECK (installments BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('pix', 'card')),
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS card_brand TEXT,
  ADD COLUMN IF NOT EXISTS card_last4 TEXT CHECK (card_last4 ~ '^[0-9]{4}$'),
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;
