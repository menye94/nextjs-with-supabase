-- Create quote_drafts table for saving draft quotes
CREATE TABLE IF NOT EXISTS quote_drafts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quote_drafts_updated_at ON quote_drafts(updated_at);

-- Add RLS policy
ALTER TABLE quote_drafts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own drafts
CREATE POLICY "Users can manage their own quote drafts" ON quote_drafts
  FOR ALL USING (auth.uid() IS NOT NULL);
