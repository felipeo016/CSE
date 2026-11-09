-- =====================================================================================
-- 004_ajustes_seguridad.sql — Ajustes del Security Advisor (Prompt F2, responsable: Felipe)
--
-- Ejecutar después de 003_funciones.sql.
--
-- Estas cuatro funciones son SECURITY DEFINER y solo deben correr como trigger. Supabase les
-- concede EXECUTE a anon y authenticated por defecto, y el Security Advisor lo marca porque
-- quedan publicadas en la API (/rest/v1/rpc/...). Aquí se les quita ese permiso.
--
-- Los triggers siguen funcionando: PostgreSQL revisa el permiso EXECUTE de la función solo al
-- crear el trigger (lo hizo postgres, su dueño), no cada vez que el trigger se dispara. Cuando un
-- usuario inserta o actualiza una fila, la función se ejecuta por el trigger aunque ese usuario
-- no pueda llamarla directamente.
-- =====================================================================================

revoke execute on function public.crear_perfil_nuevo_usuario()    from public, anon, authenticated;
revoke execute on function public.perfiles_exigir_administrador() from public, anon, authenticated;
revoke execute on function public.perfiles_sincronizar_cliente()  from public, anon, authenticated;
revoke execute on function public.productos_interes_preparar()    from public, anon, authenticated;
