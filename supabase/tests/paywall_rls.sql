-- Teste manual do paywall (staging/local: psql -f ou SQL editor). Tudo em transação com ROLLBACK.
-- Falha com ASSERT se alguma regra quebrar. NÃO executado no CI.
BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'free@t.test'),
  ('00000000-0000-0000-0000-0000000000b2', 'pro@t.test');
UPDATE public.profiles
   SET plan_tier = 'pro', subscription_status = 'active', subscription_period_end = now() + interval '10 days'
 WHERE id = '00000000-0000-0000-0000-0000000000b2';

CREATE FUNCTION pg_temp.try_as(uid uuid, stmt text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  EXECUTE stmt;
  RESET ROLE;
  RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  RESET ROLE;
  RETURN 'denied';
END $$;

DO $$
DECLARE
  free_id uuid := '00000000-0000-0000-0000-0000000000a1';
  pro_id  uuid := '00000000-0000-0000-0000-0000000000b2';
  ins text := 'INSERT INTO public.user_study_states(user_id,schema_version,state_json,checksum_sha256,client_updated_at) VALUES (%L,1,''{}'',''x'',now())';
BEGIN
  ASSERT pg_temp.try_as(free_id, format(ins, free_id)) = 'denied', 'free não deveria gravar';
  ASSERT pg_temp.try_as(pro_id, format(ins, pro_id)) = 'ok', 'pro deveria gravar';
  ASSERT pg_temp.try_as(pro_id, format(ins, free_id)) = 'denied', 'pro não grava como outro usuário';
  ASSERT pg_temp.try_as(pro_id, format('UPDATE public.user_study_states SET schema_version=0 WHERE user_id=%L', pro_id)) = 'denied', 'schema_version fora da faixa';
  ASSERT pg_temp.try_as(free_id, format('UPDATE public.profiles SET plan_tier=''pro'' WHERE id=%L', free_id)) = 'denied', 'usuário não altera o próprio plano';

  -- Usuário free não enxerga o estado do Pro (RLS de SELECT).
  PERFORM set_config('request.jwt.claims', json_build_object('sub', free_id, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  ASSERT (SELECT count(*) FROM public.user_study_states) = 0, 'free não lê estado de outro';
  RESET ROLE;
END $$;

-- Renovação: settle_billing_order soma sobre um Pro ativo e não herda vencimento de plano revogado.
-- now() é fixo dentro da transação, então as datas esperadas são exatas.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000c3', 'renova@t.test'),
  ('00000000-0000-0000-0000-0000000000d4', 'reembolsado@t.test'),
  ('00000000-0000-0000-0000-0000000000e5', 'vencido@t.test');
UPDATE public.profiles
   SET plan_tier = 'pro', subscription_status = 'active', subscription_period_end = now() + interval '10 days'
 WHERE id = '00000000-0000-0000-0000-0000000000c3';
UPDATE public.profiles
   SET plan_tier = 'free', subscription_status = 'canceled', subscription_period_end = now() + interval '366 days'
 WHERE id = '00000000-0000-0000-0000-0000000000d4';
UPDATE public.profiles
   SET plan_tier = 'pro', subscription_status = 'active', subscription_period_end = now() - interval '5 days'
 WHERE id = '00000000-0000-0000-0000-0000000000e5';
INSERT INTO public.billing_orders (id, user_id, provider_billing_id, plan_id, amount_cents) VALUES
  ('00000000-0000-0000-0000-00000000f0c3', '00000000-0000-0000-0000-0000000000c3', 'bill_renova', 'pro_monthly', 1990),
  ('00000000-0000-0000-0000-00000000f0d4', '00000000-0000-0000-0000-0000000000d4', 'bill_reembolsado', 'pro_monthly', 1990),
  ('00000000-0000-0000-0000-00000000f0e5', '00000000-0000-0000-0000-0000000000e5', 'bill_vencido', 'pro_monthly', 1990);

DO $$
BEGIN
  ASSERT public.settle_billing_order('00000000-0000-0000-0000-00000000f0c3') = TRUE, 'primeira liquidação deve valer';
  ASSERT (SELECT subscription_period_end FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000c3')
         = now() + interval '41 days', 'renovação com 10 dias restantes soma 31 (total 41)';
  ASSERT public.settle_billing_order('00000000-0000-0000-0000-00000000f0c3') = FALSE, 'liquidar de novo não faz nada';
  ASSERT (SELECT subscription_period_end FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000c3')
         = now() + interval '41 days', 'liquidação repetida não estende o plano';

  PERFORM public.settle_billing_order('00000000-0000-0000-0000-00000000f0d4');
  ASSERT (SELECT subscription_period_end FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000d4')
         = now() + interval '31 days', 'plano revogado não herda o vencimento antigo';

  PERFORM public.settle_billing_order('00000000-0000-0000-0000-00000000f0e5');
  ASSERT (SELECT subscription_period_end FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000e5')
         = now() + interval '31 days', 'Pro vencido recomeça a partir de agora';
END $$;

-- RPCs administrativos: usuário comum não pode chamá-los nem informando o UUID de um admin.
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000a9', 'admin@t.test');
UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-0000000000a9';

DO $$
DECLARE
  free_id  uuid := '00000000-0000-0000-0000-0000000000a1';
  admin_id uuid := '00000000-0000-0000-0000-0000000000a9';
BEGIN
  ASSERT pg_temp.try_as(free_id, format('SELECT public.admin_change_role(%L, %L, ''admin'', ''x'')', admin_id, free_id)) = 'denied',
    'usuário comum não promove a si mesmo com o UUID de um admin';
  ASSERT pg_temp.try_as(free_id, format('SELECT public.admin_extend_subscription(%L, %L, 30, ''x'')', admin_id, free_id)) = 'denied',
    'usuário comum não concede Pro a si mesmo com o UUID de um admin';
  ASSERT (SELECT role FROM public.profiles WHERE id = free_id) = 'student', 'role do usuário comum permanece student';
END $$;

-- push_user_state: compare-and-set, snapshot do estado anterior e paywall.
DO $$
DECLARE
  pro_id  uuid := '00000000-0000-0000-0000-0000000000b2';
  free_id uuid := '00000000-0000-0000-0000-0000000000a1';
  r jsonb;
  base timestamptz;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', pro_id, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- o Pro já tem uma linha (inserida acima); a base atual passa e grava
  SELECT server_updated_at INTO base FROM public.user_study_states WHERE user_id = pro_id;
  r := public.push_user_state(1, '{"v":2}', 'c2', 'dev-a', now(), base);
  ASSERT r->>'status' = 'ok', 'push com a base atual deve gravar';

  -- base antiga (outro aparelho já avançou): conflito e nada gravado
  r := public.push_user_state(1, '{"v":3}', 'c3', 'dev-b', now(), base - interval '1 minute');
  ASSERT r->>'status' = 'conflict', 'base desatualizada deve dar conflito';
  ASSERT (SELECT state_json->>'v' FROM public.user_study_states WHERE user_id = pro_id) = '2', 'conflito não grava';

  -- sem base (primeira sincronização) grava
  r := public.push_user_state(1, '{"v":4}', 'c4', 'dev-b', now());
  ASSERT r->>'status' = 'ok', 'push sem base grava';

  RESET ROLE;
  -- o estado anterior foi guardado (um snapshot por janela de 7 dias)
  ASSERT (SELECT count(*) FROM public.user_state_snapshots WHERE user_id = pro_id) = 1, 'um snapshot por semana';
  ASSERT pg_temp.try_as(free_id, 'SELECT public.push_user_state(1, ''{}'', ''x'', ''d'', now())') = 'denied', 'free não grava por RPC';
END $$;

ROLLBACK;
