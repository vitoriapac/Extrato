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

ROLLBACK;
