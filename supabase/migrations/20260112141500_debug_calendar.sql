-- TEMPORARY DEBUG: Allow any access to debug RLS
-- (ONLY FOR DEBUGGING THIS SPECIFIC EVENT)

-- 1. Create a function to inspect the row bypassing RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION debug_get_event(event_id uuid)
RETURNS TABLE (id uuid, user_id uuid, created_at timestamptz)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT c.id, c.user_id, c.created_at FROM calendar_events c WHERE c.id = event_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION debug_get_event TO authenticated;
