-- Fix equipment_details view with proper type casting
-- This will resolve the UUID type mismatch issues

CREATE OR REPLACE VIEW equipment_details AS
SELECT 
    e.id,
    e.name,
    e.price,
    e.is_active,
    e.created_at,
    e.updated_at,
    ec.name as category_name,
    ec.id as category_id,
    eqc.name as company_name,
    eqc.id as company_id,  -- This will be the integer ID from equipment_company
    c.currency_name as currency_code,
    c.currency_name as currency_symbol,  -- Using currency_name as symbol for now
    pt.pricing_type_name,
    pt.pricing_type_name as pricing_type_description,  -- Using pricing_type_name as description
    comp.company_name as owner_company_name,
    eqc.name as equipment_owner_name
FROM equipments e
LEFT JOIN equipment_categories ec ON e.category_id = ec.id
LEFT JOIN equipment_company eqc ON e.owner_id::text = eqc.id::text  -- Cast both to text for comparison
LEFT JOIN currency c ON e.currency_id = c.id
LEFT JOIN pricing_type pt ON e.pricing_type_id = pt.id
LEFT JOIN companies comp ON ec.owner_id = comp.id;

-- Add a comment to explain the view structure
COMMENT ON VIEW equipment_details IS 'View that joins equipment with all related data including equipment_company'; 