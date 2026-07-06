-- APPLIED to the live DB via Supabase MCP on 2026-07-06
-- Transactional public booking: locks the schedule row so concurrent bookings
-- serialize, re-checks seats inside the transaction (fixes oversell race),
-- and computes price/commission server-side instead of trusting the client.
-- Called by src/hooks/useBookingActions.ts on the public /book pages.
CREATE OR REPLACE FUNCTION public.create_booking_group(
  p_schedule_id uuid,
  p_seller_id uuid DEFAULT NULL,
  p_referral_code varchar DEFAULT NULL,
  p_customers jsonb DEFAULT '[]'::jsonb
) RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sched record;
  v_booked integer;
  v_remaining integer;
  v_count integer;
  v_commission numeric;
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_ids uuid[] := '{}';
  elem jsonb;
BEGIN
  v_count := jsonb_array_length(p_customers);
  IF v_count IS NULL OR v_count < 1 OR v_count > 50 THEN
    RAISE EXCEPTION 'จำนวนผู้เดินทางไม่ถูกต้อง';
  END IF;

  -- Lock the schedule row: concurrent bookings for the same schedule wait here
  SELECT ts.available_seats, t.price_per_person, t.commission_type, t.commission_value
  INTO v_sched
  FROM trip_schedules ts
  JOIN trips t ON t.id = ts.trip_id
  WHERE ts.id = p_schedule_id
  FOR UPDATE OF ts;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ไม่พบรอบการเดินทาง';
  END IF;

  SELECT count(*) INTO v_booked
  FROM bookings
  WHERE trip_schedule_id = p_schedule_id
    AND status IN ('approved', 'inprogress', 'pending');

  v_remaining := COALESCE(v_sched.available_seats, 0) - v_booked;
  IF v_count > v_remaining THEN
    RAISE EXCEPTION 'ที่นั่งไม่เพียงพอ มีที่นั่งเหลือเพียง % ที่นั่ง', GREATEST(v_remaining, 0);
  END IF;

  v_commission := CASE WHEN v_sched.commission_type = 'percentage'
    THEN (v_sched.price_per_person * v_sched.commission_value) / 100
    ELSE v_sched.commission_value
  END;

  FOR elem IN SELECT * FROM jsonb_array_elements(p_customers) LOOP
    INSERT INTO customers (
      full_name, email, phone, id_card, passport_number, date_of_birth,
      referred_by_code, referred_by_seller_id
    ) VALUES (
      elem->>'full_name',
      elem->>'email',
      NULLIF(elem->>'phone', ''),
      NULLIF(elem->>'id_card', ''),
      NULLIF(elem->>'passport_number', ''),
      NULLIF(elem->>'date_of_birth', '')::date,
      p_referral_code,
      p_seller_id
    ) RETURNING id INTO v_customer_id;

    INSERT INTO bookings (
      trip_schedule_id, customer_id, seller_id,
      total_amount, commission_amount, status, notes
    ) VALUES (
      p_schedule_id, v_customer_id, p_seller_id,
      v_sched.price_per_person, v_commission, 'pending', elem->>'notes'
    ) RETURNING id INTO v_booking_id;

    v_booking_ids := array_append(v_booking_ids, v_booking_id);
  END LOOP;

  RETURN v_booking_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_group(uuid, uuid, varchar, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_booking_group(uuid, uuid, varchar, jsonb) TO anon, authenticated;
