-- Simple fix for equipment_categories foreign key constraint
-- This script only adds the missing foreign key that's causing the error

-- Check if the equipment_categories table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'equipment_categories'
    ) THEN
        -- Drop any existing foreign key constraint on owner_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'equipment_categories_owner_id_fkey' 
            AND table_name = 'equipment_categories'
        ) THEN
            ALTER TABLE equipment_categories 
            DROP CONSTRAINT equipment_categories_owner_id_fkey;
        END IF;

        -- Add the missing foreign key constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_equipment_categories_company_owner' 
            AND table_name = 'equipment_categories'
        ) THEN
            ALTER TABLE equipment_categories 
            ADD CONSTRAINT fk_equipment_categories_company_owner 
            FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;

        RAISE NOTICE 'Foreign key constraint added successfully to equipment_categories';
    ELSE
        RAISE NOTICE 'equipment_categories table does not exist';
    END IF;
END $$;

-- Success message
SELECT 'Equipment categories foreign key fix completed!' as status; 