-- Migration: Create Leads Table
-- Description: Stores scraped property leads and their AI analysis results.

-- 1. Create Enum for Urgency
DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('BAJA', 'MEDIA', 'ALTA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id text UNIQUE NOT NULL, -- ID original del portal (ej: idealista_12345)
  title text NOT NULL,
  url text NOT NULL,
  price numeric,
  location text,
  description text,
  phone text,
  
  -- AI Enriched Data
  is_private_seller boolean DEFAULT false,
  urgency urgency_level DEFAULT 'BAJA',
  confidence_score integer DEFAULT 0,
  ai_summary text,
  warning_flags text[] DEFAULT '{}',
  
  raw_data jsonb, -- Guarda todo el objeto original por si acaso
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS leads_portal_id_idx ON public.leads(portal_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);

-- 4. Enable RLS (Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Adjust as needed, currently allowing read/write for authenticated users)
CREATE POLICY "Allow authenticated read access" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role write access" ON public.leads FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow service_role update access" ON public.leads FOR UPDATE TO service_role USING (true);
