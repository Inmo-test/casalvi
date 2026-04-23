-- Add columns for AI Diagnosis Caching
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS ai_diagnosis JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ DEFAULT NULL;

-- Comment on columns
COMMENT ON COLUMN properties.ai_diagnosis IS 'Cached result of AI market diagnosis (status, diagnosis, action_plan)';
COMMENT ON COLUMN properties.last_ai_analysis_at IS 'Timestamp of the last AI diagnosis generation';
