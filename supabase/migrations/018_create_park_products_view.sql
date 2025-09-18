-- Create view for park products with pricing
CREATE OR REPLACE VIEW park_products_with_pricing AS
SELECT 
  pp.id,
  pp.product_name,
  pc.category_name,
  et.entry_name,
  np.national_park_name as park_name,
  npc.national_park_circuit_name as park_circuit_name,
  cpp.usd_price,
  cpp.tzs_price,
  cpp.currency_id,
  cur.code as currency_code
FROM park_products pp
LEFT JOIN park_category pc ON pp.category_id = pc.id
LEFT JOIN entry_type et ON pp.entry_type_id = et.id
LEFT JOIN national_parks np ON pp.park_id = np.id
LEFT JOIN national_park_circuit npc ON np.park_circuit_id = npc.id
LEFT JOIN camping_products_price cpp ON pp.id = cpp.camping_product_id
LEFT JOIN currency cur ON cpp.currency_id = cur.id
WHERE pp.is_active = true 
  AND pc.is_active = true 
  AND et.is_active = true
  AND np.is_active = true;

-- Grant access to the view
GRANT SELECT ON park_products_with_pricing TO authenticated;
