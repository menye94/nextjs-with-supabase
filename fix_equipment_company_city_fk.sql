-- Fix equipment_company foreign key to cities table
-- This script adds the missing foreign key constraint

-- First, check if the foreign key constraint already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_equipment_company_city' 
        AND table_name = 'equipment_company'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE equipment_company 
        ADD CONSTRAINT fk_equipment_company_city 
        FOREIGN KEY (city_id) REFERENCES cities(id);
        
        RAISE NOTICE 'Added fk_equipment_company_city foreign key constraint';
    ELSE
        RAISE NOTICE 'fk_equipment_company_city constraint already exists';
    END IF;
END $$;

-- Also check if the foreign key to companies table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_equipment_company_owner' 
        AND table_name = 'equipment_company'
    ) THEN
        -- Add the foreign key constraint for owner_id
        ALTER TABLE equipment_company 
        ADD CONSTRAINT fk_equipment_company_owner 
        FOREIGN KEY (owner_id) REFERENCES companies(id);
        
        RAISE NOTICE 'Added fk_equipment_company_owner foreign key constraint';
    ELSE
        RAISE NOTICE 'fk_equipment_company_owner constraint already exists';
    END IF;
END $$;

-- Success message
SELECT 'Equipment company foreign key constraints checked/added!' as status; 