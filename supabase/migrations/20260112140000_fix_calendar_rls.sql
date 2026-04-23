-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplication
DROP POLICY IF EXISTS "Users can view their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;

-- Create comprehensive policies
-- 1. VIEW: Users can see events where they are the owner OR the event is assigned to their agency (if applicable)
CREATE POLICY "Users can view their own events"
ON calendar_events FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT: Users can insert events for themselves
CREATE POLICY "Users can insert their own events"
ON calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own events
CREATE POLICY "Users can update their own events"
ON calendar_events FOR UPDATE
USING (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own events
CREATE POLICY "Users can delete their own events"
ON calendar_events FOR DELETE
USING (auth.uid() = user_id);
