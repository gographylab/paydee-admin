-- APPLIED to the live DB via Supabase MCP on 2026-07-06
-- (migration name: revoke_public_execute_for_real)
--
-- The 20260706000002 revokes were ineffective: Postgres grants EXECUTE on new
-- functions to PUBLIC by default, and privileges are additive — revoking from
-- anon/authenticated leaves the PUBLIC grant standing, so anon could still call
-- every one of these via /rest/v1/rpc/ (verified live via has_function_privilege
-- and a SET ROLE anon test call).
--
-- Safe to revoke PUBLIC here: every internal caller is SECURITY DEFINER (runs as
-- postgres, which keeps its explicit grant), bookings has no UPDATE policy so its
-- gamification triggers only ever fire under service_role/postgres, and the two
-- app-called functions keep their explicit authenticated grants.
-- Deliberately untouched (public booking flow, called by anon from the browser):
-- create_booking_group, get_available_seats.

REVOKE EXECUTE ON FUNCTION public.add_locked_or_redeemable_coins(uuid, numeric, text, public.coin_source_type, uuid, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_share_coins(uuid, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unlock_coins_for_seller(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_complete_condition_2(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_sales_target_bonus(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sellers_with_emails() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_booking_approval_gamification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_check_gamification_condition_2() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_change() FROM PUBLIC;

-- App-called with a logged-in session: drop PUBLIC (and thus anon); the explicit
-- authenticated + service_role grants on these remain in place.
REVOKE EXECUTE ON FUNCTION public.complete_gamification_task(uuid, uuid, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_campaigns(uuid, uuid) FROM PUBLIC;
