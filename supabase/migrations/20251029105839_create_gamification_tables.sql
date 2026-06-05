-- =====================================================
-- GAMIFICATION SYSTEM TABLES
-- =====================================================
-- This migration creates tables for a two-condition gamification system:
-- Condition 1: Simple task completion (survey, onboarding, profile, referral)
--              Rewards earning/redeemable coins
-- Condition 2: Gated by Condition 1 completion
--              Action: unlock (convert earning to redeemable) or bonus (add extra coins)
-- =====================================================

-- Create enum for gamification condition types
CREATE TYPE gamification_condition_1_type AS ENUM (
  'survey',
  'onboarding_task',
  'profile_complete',
  'referral'
);

CREATE TYPE gamification_condition_2_type AS ENUM (
  'first_trip_sold',
  'trip_count',
  'sales_amount'
);

CREATE TYPE gamification_condition_2_action AS ENUM (
  'unlock',  -- Convert earning coins to redeemable coins
  'bonus',   -- Add bonus coins to earning or redeemable
  'none'     -- No action (just completion tracking)
);

CREATE TYPE gamification_reward_type AS ENUM (
  'earning',    -- Adds to locked balance (requires condition 2)
  'redeemable'  -- Adds to redeemable balance (immediate)
);

-- =====================================================
-- Table: gamification_campaigns
-- =====================================================
-- Stores gamification campaigns with two conditions
CREATE TABLE IF NOT EXISTS gamification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign Info
  title TEXT NOT NULL,
  description TEXT,

  -- Condition 1: Initial Task
  condition_1_type gamification_condition_1_type NOT NULL,
  condition_1_reward_amount INTEGER NOT NULL DEFAULT 0, -- Coins earned on completion
  condition_1_reward_type gamification_reward_type NOT NULL DEFAULT 'earning',

  -- Condition 2: Unlocked after Condition 1
  condition_2_type gamification_condition_2_type NOT NULL,
  condition_2_action gamification_condition_2_action NOT NULL DEFAULT 'unlock',
  condition_2_bonus_amount INTEGER NOT NULL DEFAULT 0, -- Bonus coins if action is 'bonus'

  -- Campaign Duration
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_bonus CHECK (
    (condition_2_action = 'bonus' AND condition_2_bonus_amount > 0) OR
    (condition_2_action != 'bonus')
  )
);

-- =====================================================
-- Table: gamification_progress
-- =====================================================
-- Tracks seller progress for each campaign
CREATE TABLE IF NOT EXISTS gamification_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Condition 1 Progress
  condition_1_completed BOOLEAN NOT NULL DEFAULT false,
  condition_1_completed_at TIMESTAMPTZ,

  -- Condition 2 Progress (only valid if condition_1_completed)
  condition_2_completed BOOLEAN NOT NULL DEFAULT false,
  condition_2_completed_at TIMESTAMPTZ,

  -- Full Campaign Completion
  both_completed BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(campaign_id, seller_id),
  CONSTRAINT condition_2_requires_condition_1 CHECK (
    (condition_2_completed = false) OR
    (condition_2_completed = true AND condition_1_completed = true)
  )
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_gamification_campaigns_active ON gamification_campaigns(is_active, start_date, end_date);
CREATE INDEX idx_gamification_campaigns_dates ON gamification_campaigns(start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_gamification_progress_seller ON gamification_progress(seller_id, campaign_id);
CREATE INDEX idx_gamification_progress_campaign ON gamification_progress(campaign_id) WHERE both_completed = false;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE gamification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_progress ENABLE ROW LEVEL SECURITY;

-- gamification_campaigns: Anyone can read active campaigns
CREATE POLICY "Anyone can view active gamification campaigns"
  ON gamification_campaigns
  FOR SELECT
  USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

-- gamification_campaigns: Admins can manage
CREATE POLICY "Admins can manage gamification campaigns"
  ON gamification_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- gamification_progress: Sellers can view their own progress
CREATE POLICY "Sellers can view their own gamification progress"
  ON gamification_progress
  FOR SELECT
  USING (seller_id = auth.uid());

-- gamification_progress: System can insert/update progress
CREATE POLICY "System can manage gamification progress"
  ON gamification_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Trigger Functions
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gamification_campaigns_updated_at
  BEFORE UPDATE ON gamification_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_updated_at();

CREATE TRIGGER update_gamification_progress_updated_at
  BEFORE UPDATE ON gamification_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_updated_at();

-- =====================================================
-- Function: Complete Gamification Task
-- =====================================================
CREATE OR REPLACE FUNCTION complete_gamification_task(
  p_campaign_id UUID,
  p_seller_id UUID,
  p_task_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_campaign RECORD;
  v_progress RECORD;
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- Get campaign details
  SELECT * INTO v_campaign
  FROM gamification_campaigns
  WHERE id = p_campaign_id
    AND is_active = true
    AND NOW() BETWEEN start_date AND end_date;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Campaign not found or not active'
    );
  END IF;

  -- Get or create progress record
  INSERT INTO gamification_progress (campaign_id, seller_id)
  VALUES (p_campaign_id, p_seller_id)
  ON CONFLICT (campaign_id, seller_id) DO NOTHING;

  SELECT * INTO v_progress
  FROM gamification_progress
  WHERE campaign_id = p_campaign_id
    AND seller_id = p_seller_id
  FOR UPDATE;

  -- Check if condition 1 is already completed
  IF v_progress.condition_1_completed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task already completed'
    );
  END IF;

  -- Complete Condition 1
  UPDATE gamification_progress
  SET
    condition_1_completed = true,
    condition_1_completed_at = NOW(),
    updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND seller_id = p_seller_id;

  -- Award Condition 1 coins
  v_transaction_id := add_coins(
    p_seller_id := p_seller_id,
    p_amount := v_campaign.condition_1_reward_amount,
    p_description := format('Completed: %s (Condition 1)', v_campaign.title),
    p_source_type := 'campaign',
    p_source_id := p_campaign_id::text,
    p_transaction_type := 'earn',
    p_metadata := jsonb_build_object(
      'campaign_id', p_campaign_id,
      'condition', 1,
      'reward_type', v_campaign.condition_1_reward_type
    )
  );

  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'coins_awarded', v_campaign.condition_1_reward_amount,
    'reward_type', v_campaign.condition_1_reward_type,
    'condition_2_unlocked', true
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Check and Complete Condition 2
-- =====================================================
-- This function should be called by triggers when a seller:
-- - Completes their first trip sale (first_trip_sold)
-- - Reaches a trip count milestone (trip_count)
-- - Reaches a sales amount milestone (sales_amount)
CREATE OR REPLACE FUNCTION check_and_complete_condition_2(
  p_seller_id UUID
)
RETURNS void AS $$
DECLARE
  v_progress RECORD;
  v_campaign RECORD;
  v_first_sale_count INTEGER;
BEGIN
  -- Get all active campaigns where condition 1 is complete but condition 2 is not
  FOR v_progress IN
    SELECT gp.*, gc.*
    FROM gamification_progress gp
    JOIN gamification_campaigns gc ON gc.id = gp.campaign_id
    WHERE gp.seller_id = p_seller_id
      AND gp.condition_1_completed = true
      AND gp.condition_2_completed = false
      AND gc.is_active = true
      AND NOW() BETWEEN gc.start_date AND gc.end_date
  LOOP
    -- Check condition based on type
    CASE v_progress.condition_2_type
      WHEN 'first_trip_sold' THEN
        -- Check if seller has at least 1 approved booking
        SELECT COUNT(*) INTO v_first_sale_count
        FROM bookings
        WHERE seller_id = p_seller_id
          AND status = 'approved';

        IF v_first_sale_count >= 1 THEN
          -- Complete condition 2
          UPDATE gamification_progress
          SET
            condition_2_completed = true,
            condition_2_completed_at = NOW(),
            both_completed = true,
            updated_at = NOW()
          WHERE id = v_progress.id;

          -- Apply action
          IF v_progress.condition_2_action = 'unlock' THEN
            -- Convert earning coins to redeemable
            -- This is handled by the unlock_earning_coins function or trigger
            NULL; -- Placeholder for unlock logic
          ELSIF v_progress.condition_2_action = 'bonus' THEN
            -- Award bonus coins
            PERFORM add_coins(
              p_seller_id := p_seller_id,
              p_amount := v_progress.condition_2_bonus_amount,
              p_description := format('Bonus for completing: %s', v_progress.title),
              p_source_type := 'campaign',
              p_source_id := v_progress.id::text,
              p_transaction_type := 'bonus',
              p_metadata := jsonb_build_object(
                'campaign_id', v_progress.id,
                'condition', 2,
                'action', 'bonus'
              )
            );
          END IF;
        END IF;

      -- Add more condition types as needed
      WHEN 'trip_count' THEN
        -- Implement trip count logic
        NULL;
      WHEN 'sales_amount' THEN
        -- Implement sales amount logic
        NULL;
      ELSE
        NULL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: Check Condition 2 on Booking Approval
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_check_gamification_condition_2()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when booking is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM check_and_complete_condition_2(NEW.seller_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_booking_approved_check_gamification
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION trigger_check_gamification_condition_2();

-- =====================================================
-- Sample Data (Optional - Remove in Production)
-- =====================================================
-- Insert a sample campaign
-- INSERT INTO gamification_campaigns (
--   title,
--   description,
--   condition_1_type,
--   condition_1_reward_amount,
--   condition_1_reward_type,
--   condition_2_type,
--   condition_2_action,
--   condition_2_bonus_amount,
--   start_date,
--   end_date,
--   created_by
-- ) VALUES (
--   'Welcome Challenge',
--   'Complete your profile and make your first sale!',
--   'profile_complete',
--   100,
--   'earning',
--   'first_trip_sold',
--   'unlock',
--   0,
--   NOW(),
--   NOW() + INTERVAL '30 days',
--   (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)
-- );

-- =====================================================
-- End of Migration
-- =====================================================
