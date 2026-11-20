-- =============================================================================
-- Push de estado com compare-and-set e snapshot de segurança
-- =============================================================================
-- O upsert cego do state-sync deixava "última escrita vence": dois aparelhos
-- sobrescreviam um ao outro sem aviso, e user_state_snapshots nunca era gravada.
-- Esta função faz tudo numa transação, com a linha travada:
--   1. exige Pro ativo (mesma regra da RLS);
--   2. se o cliente informou a versão-base e o servidor já avançou, devolve
--      'conflict' sem gravar (o cliente deve puxar antes);
--   3. guarda o estado anterior em user_state_snapshots (no máximo 1 por 7 dias,
--      mantém os 8 mais recentes);
--   4. grava o novo estado.
-- Sem p_base_version (clientes antigos / primeira sincronização) grava, mas o
-- snapshot preserva o que havia.

CREATE OR REPLACE FUNCTION public.push_user_state(
  p_schema_version INTEGER,
  p_state JSONB,
  p_checksum TEXT,
  p_device_id TEXT,
  p_client_updated_at TIMESTAMPTZ,
  p_base_version TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_cur public.user_study_states%ROWTYPE;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_active_pro(v_uid) THEN
    RAISE EXCEPTION 'subscription_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cur FROM public.user_study_states WHERE user_id = v_uid FOR UPDATE;

  IF FOUND THEN
    -- 1 ms de folga: o cliente guarda o horário como string/Date, que trunca microssegundos.
    IF p_base_version IS NOT NULL AND v_cur.server_updated_at > p_base_version + INTERVAL '1 millisecond' THEN
      RETURN jsonb_build_object(
        'status', 'conflict',
        'serverUpdatedAt', v_cur.server_updated_at,
        'checksum', v_cur.checksum_sha256
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.user_state_snapshots
       WHERE user_id = v_uid AND created_at > v_now - INTERVAL '7 days'
    ) THEN
      INSERT INTO public.user_state_snapshots (user_id, schema_version, state_json, checksum_sha256, reason)
      VALUES (v_uid, v_cur.schema_version, v_cur.state_json, v_cur.checksum_sha256, 'auto_weekly');

      DELETE FROM public.user_state_snapshots
       WHERE user_id = v_uid
         AND id NOT IN (
           SELECT id FROM public.user_state_snapshots
            WHERE user_id = v_uid ORDER BY created_at DESC LIMIT 8
         );
    END IF;
  END IF;

  INSERT INTO public.user_study_states
    (user_id, schema_version, state_json, checksum_sha256, device_id, client_updated_at, server_updated_at)
  VALUES
    (v_uid, p_schema_version, p_state, p_checksum, p_device_id, p_client_updated_at, v_now)
  ON CONFLICT (user_id) DO UPDATE SET
    schema_version = EXCLUDED.schema_version,
    state_json = EXCLUDED.state_json,
    checksum_sha256 = EXCLUDED.checksum_sha256,
    device_id = EXCLUDED.device_id,
    client_updated_at = EXCLUDED.client_updated_at,
    server_updated_at = EXCLUDED.server_updated_at;

  RETURN jsonb_build_object('status', 'ok', 'serverUpdatedAt', v_now, 'checksum', p_checksum);
END;
$$;

REVOKE ALL ON FUNCTION public.push_user_state(INTEGER, JSONB, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.push_user_state(INTEGER, JSONB, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
