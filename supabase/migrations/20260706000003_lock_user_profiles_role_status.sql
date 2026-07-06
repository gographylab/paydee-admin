-- ⚠️ NOT YET APPLIED TO THE LIVE DB — run in Supabase SQL Editor (or via Supabase MCP)
-- Security: the original policies let any authenticated user INSERT/UPDATE their own
-- user_profiles row with an arbitrary role/status → self-promotion to admin via a
-- direct PostgREST call (app-side fixes can't stop that). This locks role/status
-- changes at the database layer.
--
-- Check current live policies first:
--   SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'user_profiles';

-- 1) Registration inserts may only create a plain pending seller
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND role = 'seller' AND status = 'pending'
  );

-- 2) Self-updates can never change role, and can only move status to 'pending'
--    (the seller-verification resubmit flow). Admin/service-role paths are exempt.
--    RLS WITH CHECK can't compare OLD vs NEW, so a trigger enforces it.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := current_setting('request.jwt.claims', true)::json->>'role';
BEGIN
  -- service-role clients (admin APIs) manage roles/statuses freely
  IF jwt_role = 'service_role' OR jwt_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- admins acting through their own session too
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'changing role is not allowed';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'changing status is not allowed';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_change ON user_profiles;
CREATE TRIGGER trg_prevent_profile_privilege_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_change();

-- Internal guard — not callable via the REST API
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_change() FROM anon, authenticated;
