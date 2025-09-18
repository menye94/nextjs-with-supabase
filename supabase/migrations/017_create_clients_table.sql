-- Create clients table for customer management
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  country VARCHAR NOT NULL,
  address TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_client_email_per_company UNIQUE (email, company_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_country ON clients(country);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage clients for their company
CREATE POLICY "Users can manage clients for their company" ON clients
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Create function to automatically set company_id for new clients
CREATE OR REPLACE FUNCTION set_client_company_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the company_id for the current user
  SELECT id INTO NEW.company_id
  FROM companies
  WHERE owner_id = auth.uid()
  LIMIT 1;
  
  -- If no company found, raise an error
  IF NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'No company found for current user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set company_id
CREATE TRIGGER set_client_company_id_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_client_company_id();
