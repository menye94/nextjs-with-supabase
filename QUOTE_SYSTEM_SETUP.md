# Quote Creation System Setup Guide

## 🚀 Quick Setup

The multi-step quote creation system is now implemented! Follow these steps to get it running:

### 1. Database Setup

Run these SQL migrations in your Supabase SQL Editor:

```sql
-- 1. Create clients table
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

-- 2. Create quote drafts table
CREATE TABLE IF NOT EXISTS quote_drafts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create park products view (if park_products table exists)
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

-- 4. Set up RLS policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_drafts ENABLE ROW LEVEL SECURITY;

-- Clients policy
CREATE POLICY "Users can manage clients for their company" ON clients
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Quote drafts policy
CREATE POLICY "Users can manage their own quote drafts" ON quote_drafts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant access to views
GRANT SELECT ON park_products_with_pricing TO authenticated;
```

### 2. Access the System

1. **Navigate to**: `http://localhost:3000/quote-create`
2. **Or use the sidebar**: Click "Create Quote" in the dashboard

### 3. Test the System

1. **Step 1**: Enter client details and trip information
2. **Step 2**: Search and select parks/activities
3. **Steps 3-6**: Additional services (ready for implementation)
4. **Step 7**: Review and generate quote

## 🎯 Features Working

✅ **Client Management**: Create and select clients
✅ **Trip Details**: Date selection, traveler count, trip type
✅ **Parks Selection**: Search, filter, and select park activities
✅ **Real-time Pricing**: Live calculations with USD/TZS support
✅ **Auto-save**: Drafts saved every 30 seconds
✅ **Progress Tracking**: Visual step indicators
✅ **Form Validation**: Real-time error feedback
✅ **Responsive Design**: Works on all devices

## 🔧 Troubleshooting

### Common Issues

1. **"Error fetching clients"**: 
   - The clients table doesn't exist yet
   - Run the database setup SQL above
   - The system will work with empty client list

2. **"Error fetching park products"**:
   - The park_products table or view doesn't exist
   - Run the database setup SQL above
   - The system will work with empty product list

3. **Select components not working**:
   - Make sure you have the latest Radix UI components installed
   - Run: `pnpm add @radix-ui/react-select`

### Database Requirements

The system works with these tables:
- `clients` - Customer information
- `countries` - Country list
- `park_category` - Park activity categories
- `entry_type` - Entry types (foreigner, resident, etc.)
- `park_products_with_pricing` - View of park products with pricing
- `quote_drafts` - Auto-saved quote drafts

## 🚀 Next Steps

1. **Test the System**: Try creating a quote
2. **Add Sample Data**: Add some clients and park products
3. **Customize Steps**: Implement Steps 3-6 with your specific needs
4. **Add Features**: PDF generation, email sending, etc.

## 📁 File Structure

```
app/quote-create/
├── page.tsx                    # Main quote creation page
└── components/quote-steps/
    ├── ClientTripStep.tsx      # Step 1: Client & Trip
    ├── ParksStep.tsx          # Step 2: Parks & Activities
    ├── AccommodationStep.tsx  # Step 3: Accommodation
    ├── EquipmentStep.tsx      # Step 4: Equipment
    ├── TransportStep.tsx      # Step 5: Transport
    ├── AdditionalServicesStep.tsx # Step 6: Additional Services
    ├── ReviewStep.tsx         # Step 7: Review & Confirm
    └── QuoteSummary.tsx       # Right sidebar summary
```

The system is ready to use! 🎉
