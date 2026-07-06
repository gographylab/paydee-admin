-- APPLIED to the live DB via Supabase MCP on 2026-07-06
-- (migration name: close_advisor_rls_and_grant_gaps)
--
-- Supabase security-advisor cleanup (all verified unused by both apps' code;
-- real writers are SECURITY DEFINER functions / service_role, which BYPASSRLS):

-- 1) Anyone could INSERT/UPDATE/DELETE any seller's gamification progress
--    (USING true / WITH CHECK true, roles {public}) → coin-farming vector.
DROP POLICY IF EXISTS "System can manage gamification progress" ON public.gamification_progress;

-- 2) Anyone could insert activity completions for any seller (WITH CHECK true).
DROP POLICY IF EXISTS "Service role insert activity completions" ON public.seller_activity_completions;

-- 3) Per-seller booking aggregates were readable by anon/authenticated
--    (materialized views can't have RLS). service_role keeps its own grant.
REVOKE SELECT ON public.seller_booking_stats FROM anon, authenticated;

-- 4) SECURITY DEFINER view bypassed RLS of the querying user; underlying
--    trips/trip_schedules already have public SELECT policies for active rows.
ALTER VIEW public.trips_with_next_schedule SET (security_invoker = true);

-- Advisor findings deliberately left open:
-- * function_search_path_mutable (20 fns) — anon/authenticated have no CREATE
--   on schema public here, so search_path hijack isn't practically exploitable;
--   pin search_path opportunistically when a function is next edited.
-- * auth_otp_long_expiry, auth_leaked_password_protection,
--   vulnerable_postgres_version — Dashboard/platform settings, not SQL.
