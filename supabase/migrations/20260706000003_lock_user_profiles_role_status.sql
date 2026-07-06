-- ⚠️ NOT YET APPLIED TO THE LIVE DB — run in Supabase SQL Editor (or via Supabase MCP)
-- Security: the original policies let any authenticated user INSERT/UPDATE their own
-- user_profiles row with an arbitrary role/status → self-promotion to admin via a
-- direct PostgREST call (app-side fixes can't stop that). This locks role/status
-- changes at the database layer.
--
-- Safe to run as-is: idempotent, and it drops *every* existing INSERT policy on
-- user_profiles by catalog lookup rather than guessing the live policy's name.

-- 1) Registration inserts may only create a plain pending seller
DO $do$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_profiles', p.policyname);
  END LOOP;
END
$do$;
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND role = 'seller' AND status = 'pending'
  );

-- 2) Non-privileged writes can never grant privileges. RLS WITH CHECK can't
--    compare OLD vs NEW (and a stray FOR ALL policy would OR around a strict
--    INSERT policy anyway), so a trigger enforces it on INSERT and UPDATE:
--    inserts must be pending sellers; updates can't change role, and can only
--    move status to 'pending' (the seller-verification resubmit flow).
--    Admin/service-role paths are exempt.
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

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'seller' OR NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'new profiles must be pending sellers';
    END IF;
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
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_change();

-- Internal guard — not callable via the REST API
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_change() FROM anon, authenticated;
