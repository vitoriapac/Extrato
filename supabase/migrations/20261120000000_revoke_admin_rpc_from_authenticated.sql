-- =============================================================================
-- Fecha escalada de privilégio nos RPCs administrativos
-- =============================================================================
-- admin_extend_subscription e admin_change_role são SECURITY DEFINER e validam o
-- operador pelo parâmetro p_admin_id, não por auth.uid(). Com EXECUTE liberado
-- para "authenticated", qualquer usuário logado podia chamar o RPC pelo
-- PostgREST informando o UUID de um admin e conceder Pro a si mesmo ou
-- promover-se a admin. Só a edge function admin-api os chama, e o faz com a
-- service_role depois de verificar o operador; "authenticated" não precisa deles.
-- is_admin e has_active_pro continuam liberados: as policies de RLS os avaliam
-- com a role do usuário.

REVOKE EXECUTE ON FUNCTION public.admin_extend_subscription(UUID, UUID, INTEGER, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_change_role(UUID, UUID, TEXT, TEXT) FROM authenticated;
