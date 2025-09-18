# Offers & Contracts System Guide

## Overview
This system manages safari offers, promotional offers, and contracts for the safari booking platform. It provides a comprehensive way to create, manage, and track offers with various service types.

## Core Tables

### 1. `offer` Table
The main table for managing safari offers.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique identifier
- `offer_code` (VARCHAR) - Unique offer code (e.g., "OFF001")
- `offer_name` (VARCHAR) - Human-readable offer name
- `active_from` (DATE) - When the offer becomes active
- `active_to` (DATE) - When the offer expires
- `time_accepted` (TIMESTAMP) - When the offer was accepted (optional)
- `accepted` (BOOLEAN) - Whether the offer has been accepted
- `promo_offer_id` (INTEGER) - Reference to promotional offer (optional)
- `client_id` (INTEGER) - Reference to the client/customer (from customers table)
- `owner_id` (UUID) - Reference to the company that owns this offer
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Key Relationships:**
- `client_id` → `customers.id` (Foreign Key)
- `promo_offer_id` → `promo_offer.id` (Foreign Key, optional)
- `owner_id` → `companies.id` (Foreign Key)

**Indexes:**
- Primary key on `id`
- Index on `client_id` for performance
- Index on `owner_id` for company-based queries

**RLS Policies:**
- Users can only access offers from their company
- Based on `memberships` table for user-company relationships

#### 2. **Service Junction Tables**
- **`offer_crew_services`** - Links offers to crew products with pricing
- **`offer_hotel_services`** - Links offers to hotel rates with pricing
- **`offer_transport_services`** - Links offers to transport services with pricing
- **`offer_park_services`** - Links offers to park products with pricing
- **`offer_camping_services`** - Links offers to camping products with pricing
- **`offer_motor_vehicle_services`** - Links offers to motor vehicle products with pricing
- **`offer_equipment_services`** - Links offers to equipment with pricing

#### 3. **Contract Management**
- **`contract`** - Signed contracts with payment tracking
- **`contract_services`** - Individual services included in contracts

#### 4. **Promotional System**
- **`promo_offer_crew_services`** - Promotional pricing for crew services
- **`promo_offer_hotel_services`** - Promotional pricing for hotel services
- **`promo_offer_transport_services`** - Promotional pricing for transport services

## Key Features

### 1. **Flexible Service Bundling**
- Combine any combination of services from different categories
- Set individual pricing and discounts for each service
- Automatic calculation of final service prices

### 2. **Promotional Offers**
- Percentage or fixed amount discounts
- Usage limits and minimum order amounts
- Date-based validity periods
- Automatic discount application

### 3. **Contract Management**
- Track payment status and amounts
- Support for refunds and cancellations
- Automatic total price calculations
- Service-level tracking within contracts

### 4. **Multi-tenant Support**
- Company-based data isolation
- Row-level security (RLS) policies
- User role-based access control

## Database Relationships

```
offer (1) ←→ (many) offer_*_services
offer (1) ←→ (1) promo_offer (optional)
offer (1) ←→ (1) contract
offer (many) ←→ (1) customer
offer (many) ←→ (1) agent
offer (many) ←→ (1) company
```

## Usage Examples

### Creating an Offer

```sql
-- Insert a new offer
INSERT INTO offer (
    offer_code, 
    offer_name, 
    active_from, 
    agent_id, 
    customer_id, 
    owner_id
) VALUES (
    generate_offer_code(),
    'Safari Package 2024',
    '2024-01-01',
    1, -- agent_id
    1, -- customer_id
    'company-uuid' -- owner_id
);

-- Add crew services to the offer
INSERT INTO offer_crew_services (
    offer_id,
    crew_product_id,
    price,
    discount_percent,
    final_service_price,
    description
) VALUES (
    1, -- offer_id
    1, -- crew_product_id
    100.00, -- original price
    10.00, -- 10% discount
    90.00, -- final price
    'Pilot service for 3 days'
);
```

### Creating a Promotional Offer

```sql
-- Insert a promotional offer
INSERT INTO promo_offer (
    promo_offer_code,
    promo_offer_name,
    active_from,
    active_to,
    discount_type,
    discount_value,
    min_order_amount,
    usage_limit,
    owner_id
) VALUES (
    generate_promo_offer_code(),
    'Summer Sale 2024',
    '2024-06-01',
    '2024-08-31',
    'percentage',
    15.00, -- 15% discount
    500.00, -- minimum order
    100, -- usage limit
    'company-uuid'
);
```

### Creating a Contract

```sql
-- Insert a contract
INSERT INTO contract (
    contract_code,
    customer_id,
    agent_id,
    offer_id,
    total_price,
    owner_id
) VALUES (
    generate_contract_code(),
    1, -- customer_id
    1, -- agent_id
    1, -- offer_id
    500.00, -- total_price
    'company-uuid'
);
```

## Utility Functions

### 1. **Code Generation**
- `generate_offer_code()` - Creates unique offer codes (OFF00001, OFF00002, etc.)
- `generate_contract_code()` - Creates unique contract codes (CON00001, CON00002, etc.)
- `generate_promo_offer_code()` - Creates unique promotional codes (PROMO001, PROMO002, etc.)

### 2. **Calculations**
- `calculate_offer_total(offer_id)` - Calculates total price for an offer
- `is_promo_offer_valid(promo_id, order_amount)` - Checks if promotional offer is valid

### 3. **Views**
- `offers_with_totals` - Offers with calculated totals and related data
- `contracts_with_details` - Contracts with customer, agent, and offer details
- `promotional_offers_with_stats` - Promotional offers with usage statistics

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access data from their company
- Automatic filtering based on user membership

### Access Control
- Company-based data isolation
- User role-based permissions
- Secure data access patterns

## Integration with Existing System

### Crew Management
- Your existing `crew_product` table remains unchanged
- New `offer_crew_services` table links offers to crew products
- Maintains all existing functionality

### Hotel Management
- Integrates with existing `hotel_rates` table
- Offers can include multiple hotel services
- Seasonal pricing support maintained

### Transport Management
- Works with existing `transport_services` table
- Route-based pricing preserved
- Company-specific transport options

### Other Services
- Park entry services
- Camping services
- Motor vehicle services
- Equipment rentals

## Next Steps

### Phase 1: Basic Offer Management ✅
- Database schema created
- TypeScript types defined
- Core functionality implemented

### Phase 2: Frontend Implementation (Next)
- Create offers page
- Offer creation workflow
- Service selection interface
- Pricing and discount management

### Phase 3: Promotional System
- Promotional offer management
- Discount application logic
- Usage tracking

### Phase 4: Contract Management
- Contract creation workflow
- Payment tracking interface
- Status management

## Benefits

1. **Centralized Management** - All offers and contracts in one system
2. **Flexible Pricing** - Individual service pricing with discounts
3. **Promotional Support** - Built-in promotional offer system
4. **Contract Tracking** - Complete contract lifecycle management
5. **Multi-service Support** - Combine any combination of services
6. **Scalable Architecture** - Easy to add new service types
7. **Security** - Company-based data isolation
8. **Integration** - Seamless integration with existing services

## Technical Notes

- All tables use proper foreign key constraints
- Automatic price calculations with constraints
- Comprehensive indexing for performance
- Trigger-based total price updates
- Support for soft deletes and audit trails

This system provides a solid foundation for managing complex offers and contracts while maintaining the flexibility to adapt to your specific business needs.
