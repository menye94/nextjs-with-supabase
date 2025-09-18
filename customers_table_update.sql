-- Update customers table to change company_id to owner_id with proper foreign key reference

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS customers;

-- Create the updated customers table
CREATE TABLE customers (
    id serial NOT NULL,
    cus_first_name varchar,
    cus_last_name varchar,
    cus_address varchar,
    cus_email_address varchar,
    cus_details varchar,
    customer_from date,
    cus_is_active boolean,
    owner_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    country_id int,
    since timestamptz,
    PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(cus_email_address);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(cus_is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security
CREATE POLICY "Users can view customers from their company" ON customers
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert customers for their company" ON customers
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update customers from their company" ON customers
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete customers from their company" ON customers
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Customer information table with company ownership';
COMMENT ON COLUMN customers.owner_id IS 'Reference to the company that owns this customer record'; 