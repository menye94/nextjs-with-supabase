# Motor Vehicle Tables Guide

This guide explains the structure and usage of the motor vehicle related tables in the Safari Quote system.

## Table Structure

### 1. motor_vehicle_entry_type

**Purpose**: Defines the types of motor vehicles that can enter national parks.

**Columns**:
- `id` (SERIAL PRIMARY KEY): Unique identifier
- `name` (VARCHAR(255)): Vehicle type name (e.g., "Motorcycle", "Car", "SUV")
- `is_active` (BOOLEAN): Whether this vehicle type is currently active
- `is_deleted` (BOOLEAN): Soft delete flag
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Sample Data**:
- Motorcycle
- Car
- SUV
- Truck
- Bus
- Trailer
- Heavy Equipment
- ATV (All-Terrain Vehicle)
- RV (Recreational Vehicle)
- Commercial Vehicle
- Agricultural Vehicle
- Construction Vehicle

### 2. motor_vehicle_products

**Purpose**: Defines motor vehicle products for each national park with weight ranges and pricing categories.

**Columns**:
- `id` (SERIAL PRIMARY KEY): Unique identifier
- `park_id` (INTEGER): Reference to national_parks table
- `motor_vehicle_entry_type_id` (INTEGER): Reference to motor_vehicle_entry_type table
- `low_weight` (INTEGER): Minimum weight in kg for this category
- `high_weight` (INTEGER): Maximum weight in kg for this category
- `is_active` (BOOLEAN): Whether this product is currently active
- `is_deleted` (BOOLEAN): Soft delete flag
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints**:
- `low_weight >= 0`
- `high_weight >= low_weight`
- Unique combination of park_id, motor_vehicle_entry_type_id, low_weight, and high_weight

**Sample Weight Ranges**:
- Motorcycle: 0-200 kg
- Car: 200-1500 kg
- SUV: 1500-3000 kg
- Truck: 3000-8000 kg
- Bus: 8000-15000 kg
- Trailer: 0-5000 kg
- Heavy Equipment: 5000-50000 kg

### 3. motor_vehicle_products_price

**Purpose**: Defines pricing for motor vehicle products with tax behavior and currency support.

**Columns**:
- `id` (SERIAL PRIMARY KEY): Unique identifier
- `tax_behaviour_id` (INTEGER): Reference to tax_behaviour table
- `motor_vehicle_product_id` (INTEGER): Reference to motor_vehicle_products table
- `currency_id` (INTEGER): Reference to currency table
- `unit_amount` (DECIMAL(10,2)): Price per unit
- `is_active` (BOOLEAN): Whether this price is currently active
- `is_deleted` (BOOLEAN): Soft delete flag
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints**:
- `unit_amount >= 0`
- Unique combination of motor_vehicle_product_id, tax_behaviour_id, and currency_id

## Database Relationships

```
national_parks (1) ←→ (many) motor_vehicle_products
motor_vehicle_entry_type (1) ←→ (many) motor_vehicle_products
motor_vehicle_products (1) ←→ (many) motor_vehicle_products_price
tax_behaviour (1) ←→ (many) motor_vehicle_products_price
currency (1) ←→ (many) motor_vehicle_products_price
```

## Views

### 1. motor_vehicle_products_with_prices

**Purpose**: Comprehensive view combining all motor vehicle data for easy querying.

**Includes**:
- Product details (park, vehicle type, weight range)
- Price details (amount, tax behavior, currency)
- Related table information (park name, vehicle type name, etc.)

### 2. motor_vehicle_products_summary

**Purpose**: Summary view for reporting and analytics.

**Includes**:
- Product counts by park and vehicle type
- Weight ranges (min/max)
- Price statistics (average, min, max)

## Usage Examples

### Query all motor vehicle products for a specific park

```sql
SELECT 
  mvp.id,
  np.national_park_name as park_name,
  mvet.name as vehicle_type,
  mvp.low_weight,
  mvp.high_weight,
  mvpp.unit_amount,
  c.symbol as currency
FROM motor_vehicle_products mvp
JOIN national_parks np ON mvp.park_id = np.id
JOIN motor_vehicle_entry_type mvet ON mvp.motor_vehicle_entry_type_id = mvet.id
LEFT JOIN motor_vehicle_products_price mvpp ON mvp.id = mvpp.motor_vehicle_product_id
LEFT JOIN currency c ON mvpp.currency_id = c.id
WHERE np.national_park_name = 'Serengeti National Park'
  AND mvp.is_deleted = false
  AND mvet.is_deleted = false;
```

### Find pricing for a specific vehicle weight

```sql
SELECT 
  mvp.id,
  np.national_park_name as park_name,
  mvet.name as vehicle_type,
  mvpp.unit_amount,
  c.symbol as currency
FROM motor_vehicle_products mvp
JOIN national_parks np ON mvp.park_id = np.id
JOIN motor_vehicle_entry_type mvet ON mvp.motor_vehicle_entry_type_id = mvet.id
JOIN motor_vehicle_products_price mvpp ON mvp.id = mvpp.motor_vehicle_product_id
JOIN currency c ON mvpp.currency_id = c.id
WHERE mvp.low_weight <= 2500 
  AND mvp.high_weight >= 2500
  AND mvp.is_deleted = false
  AND mvet.is_deleted = false;
```

### Get summary statistics by park

```sql
SELECT * FROM motor_vehicle_products_summary
WHERE park_name = 'Serengeti National Park';
```

## Data Management

### Adding New Vehicle Types

```sql
INSERT INTO motor_vehicle_entry_type (name, is_active) 
VALUES ('Electric Vehicle', true);
```

### Adding New Products

```sql
INSERT INTO motor_vehicle_products (park_id, motor_vehicle_entry_type_id, low_weight, high_weight)
VALUES (1, 1, 0, 150); -- Motorcycle with 0-150kg range for park 1
```

### Adding/Updating Prices

```sql
INSERT INTO motor_vehicle_products_price (tax_behaviour_id, motor_vehicle_product_id, currency_id, unit_amount)
VALUES (1, 1, 1, 20.00)
ON CONFLICT (motor_vehicle_product_id, tax_behaviour_id, currency_id) 
DO UPDATE SET unit_amount = EXCLUDED.unit_amount, updated_at = NOW();
```

## Best Practices

1. **Weight Ranges**: Ensure weight ranges don't overlap within the same park and vehicle type
2. **Pricing**: Always specify tax behavior and currency for accurate pricing
3. **Soft Deletes**: Use soft deletes to maintain data integrity
4. **Indexing**: The tables include proper indexes for performance
5. **Constraints**: Use the provided constraints to ensure data quality

## Migration

To apply these tables to your database:

1. Run the migration file: `015_create_motor_vehicle_tables.sql`
2. Run the seed data file: `motor_vehicle_seed_data.sql`
3. Verify the tables and views were created correctly
4. Test with sample queries

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**: Ensure referenced tables (national_parks, tax_behaviour, currency) exist
2. **Weight Range Conflicts**: Check for overlapping weight ranges in the same park/vehicle type
3. **Duplicate Prices**: Ensure unique combinations of product, tax behavior, and currency

### Validation Queries

```sql
-- Check for overlapping weight ranges
SELECT 
  park_id, 
  motor_vehicle_entry_type_id,
  COUNT(*) as conflicts
FROM motor_vehicle_products
WHERE is_deleted = false
GROUP BY park_id, motor_vehicle_entry_type_id
HAVING COUNT(*) > 1;

-- Check for products without prices
SELECT mvp.* 
FROM motor_vehicle_products mvp
LEFT JOIN motor_vehicle_products_price mvpp ON mvp.id = mvpp.motor_vehicle_product_id
WHERE mvpp.id IS NULL AND mvp.is_deleted = false;
```

## Future Enhancements

1. **Seasonal Pricing**: Add date-based pricing variations
2. **Bulk Discounts**: Implement quantity-based pricing
3. **Dynamic Weight Calculation**: Add support for dynamic weight-based pricing
4. **Multi-Currency Support**: Enhanced currency conversion features
5. **Audit Trail**: Track all pricing changes over time
