-- ==============================================
-- Performance index for seller dashboard queries
-- APPLIED to the live DB via Supabase MCP on 2026-07-06
-- (migration name: add_bookings_seller_status_created_index)
--
-- Note: earlier drafts of this file also widened the commission_payments
-- payment_type CHECK — not needed: the live constraint already allows
-- ('partial_commission','final_commission','cancellation_commission'),
-- which is what the app writes as of 2026-07-06. The live DB also already
-- had indexes on coin_transactions(seller_id, created_at),
-- coin_redemptions(seller_id, status), coin_redemptions(status), and
-- user_profiles(role). The repo's root SQL files are stale — trust the
-- live schema (supabase MCP list_tables / list_migrations).
-- ==============================================

-- Seller dashboard: stats / sold-trips / ranking filter by seller + status
-- with a created_at range and ordering
CREATE INDEX IF NOT EXISTS idx_bookings_seller_status_created
ON bookings (seller_id, status, created_at DESC);
