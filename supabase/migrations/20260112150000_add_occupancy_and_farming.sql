-- Migration: Add occupancy status and farming intelligence features
-- This enables AI-powered follow-up scheduling based on property occupancy

-- 1. Add occupancy status to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS occupancy_status TEXT DEFAULT 'unknown' 
CHECK (occupancy_status IN ('owner_occupied', 'vacant', 'rented', 'other_agency', 'unknown'));

-- 2. Add auto_generated flags to calendar_events for AI farming
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generation_reason TEXT;

-- 3. Create farming_settings table for customizable follow-up intervals
CREATE TABLE IF NOT EXISTS farming_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Base intervals by occupancy (in days)
  interval_owner_occupied INT DEFAULT 30,
  interval_vacant INT DEFAULT 7,
  interval_rented INT DEFAULT 45,
  interval_other_agency INT DEFAULT 60,
  interval_unknown INT DEFAULT 30,
  
  -- AI modifiers enabled
  ai_scoring_enabled BOOLEAN DEFAULT true,
  ai_intent_enabled BOOLEAN DEFAULT true,
  ai_urgency_keywords TEXT[] DEFAULT ARRAY['problemas inquilino', 'quiero vender', 'contrato vence', 'vender pronto'],
  
  -- Safety limits
  min_interval_days INT DEFAULT 3,
  max_interval_days INT DEFAULT 90,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 4. Enable RLS on farming_settings
ALTER TABLE farming_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own farming settings" ON farming_settings;
CREATE POLICY "Users manage their own farming settings"
ON farming_settings FOR ALL
USING (auth.uid() = user_id);

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_properties_occupancy ON properties(occupancy_status);
CREATE INDEX IF NOT EXISTS idx_calendar_auto_generated ON calendar_events(auto_generated) WHERE auto_generated = true;

-- 6. Create function to initialize default farming settings for new users
CREATE OR REPLACE FUNCTION initialize_farming_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO farming_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-create farming settings for new users
DROP TRIGGER IF EXISTS trg_initialize_farming_settings ON auth.users;
CREATE TRIGGER trg_initialize_farming_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_farming_settings();

-- 8. Backfill existing users with default farming settings
INSERT INTO farming_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE farming_settings IS 'User-configurable settings for intelligent AI-powered follow-up scheduling';
COMMENT ON COLUMN properties.occupancy_status IS 'Current occupancy status for intelligent farming intervals';
COMMENT ON COLUMN calendar_events.auto_generated IS 'True if this event was created automatically by the AI farming engine';
COMMENT ON COLUMN calendar_events.generation_reason IS 'Human-readable explanation of why this event was auto-created';
