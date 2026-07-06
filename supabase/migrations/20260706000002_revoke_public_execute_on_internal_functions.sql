-- APPLIED to the live DB via Supabase MCP on 2026-07-06
-- Security: these SECURITY DEFINER functions were callable by anon/authenticated
-- via the REST API, but have no app or edge-function caller — they are internal
-- (called from other SQL functions/triggers, which run as the function owner).
-- Coin-granting + email-dumping functions locked down per Supabase advisor.
REVOKE EXECUTE ON FUNCTION public.add_locked_or_redeemable_coins(uuid, numeric, text, public.coin_source_type, uuid, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_share_coins(uuid, uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unlock_coins_for_seller(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_complete_condition_2(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_sales_target_bonus(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_sellers_with_emails() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_booking_approval_gamification() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_check_gamification_condition_2() FROM anon, authenticated;

-- Called by the app with a logged-in session — keep authenticated, drop anon
REVOKE EXECUTE ON FUNCTION public.complete_gamification_task(uuid, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_campaigns(uuid, uuid) FROM anon;
