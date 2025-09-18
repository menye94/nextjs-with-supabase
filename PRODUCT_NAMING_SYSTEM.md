# 🏞️ Park Product Naming System

## Overview
This document explains the new abbreviated naming system for park products that makes product names shorter, more distinctive, and easier to manage.

## ✨ What Changed

### Before (Old System)
- **Product names were very long**: 80+ characters
- **Example**: "serengeti national park - non resident - entrance - Of or above the age of 16 years - per day"
- **Problems**: Hard to read, search, and display in UI

### After (New System)
- **Product names are short**: 8-12 characters
- **Example**: "SER-NR-16+"
- **Benefits**: Easy to read, search, and display

## 🔤 Naming Convention

### Format: `[PARK_ABBR]-[ENTRY_ABBR]-[AGE_ABBR]`

### Park Abbreviations
| Park Name | Abbreviation |
|-----------|--------------|
| Serengeti National Park | `SER` |
| Nyerere National Park | `NYE` |
| Ngorongoro Conservation Area | `NGO` |
| Grumeti Game Reserve | `GRU` |
| Selous Game Reserve | `SEL` |
| Maswa Game Reserve | `MAS` |
| Ikorongo Game Reserve | `IKO` |
| Arusha National Park | `ARU` |
| Tarangire National Park | `TAR` |
| Lake Manyara National Park | `LAK` |
| Kilimanjaro National Park | `KIL` |
| Burigi Chato National Park | `BUR` |
| Ibanda-Kyerwa National Park | `IBA` |

### Entry Type Abbreviations
| Entry Type | Abbreviation |
|------------|--------------|
| Non Resident | `NR` |
| East Africa Citizen | `EAC` |
| Crew Fee | `CF` |
| Resident | `RES` |
| Student | `STU` |
| Senior | `SEN` |

### Age Group Abbreviations
| Age Group | Abbreviation |
|-----------|--------------|
| Of or above the age of 16 years | `16+` |
| Between the age of 5 and 15 years | `5-15` |
| Below the age of 5 years | `0-4` |
| Student | `STU` |
| Senior | `SEN` |
| Infant | `INF` |
| Child | `CHD` |
| Adult | `ADT` |

## 📋 Examples

| Full Description | Abbreviated Name |
|------------------|------------------|
| Serengeti - Non Resident - Adult (16+) | `SER-NR-16+` |
| Nyerere - East Africa Citizen - Child (5-15) | `NYE-EAC-5-15` |
| Ngorongoro - Non Resident - Adult (16+) | `NGO-NR-16+` |
| Serengeti - Crew Fee - Adult (16+) | `SER-CF-16+` |

## 🛠️ Technical Implementation

### Database Functions
- **`generate_park_product_name(park_id, entry_type_id, age_group_id)`**: Generates abbreviated names for new products
- **Trigger**: Automatically generates names when inserting new records

### Database Views
- **`park_product_readable`**: Shows abbreviated names with full details for better readability

### Automatic Updates
- All existing product names have been automatically updated to the new format
- New products will automatically get abbreviated names

## 🎯 Benefits

### For Users
- **Easier to read** in tables and forms
- **Faster to identify** specific products
- **Better search experience** with shorter names

### For Developers
- **Smaller database storage** (8-12 chars vs 80+ chars)
- **Faster queries** and indexing
- **Easier UI display** in limited spaces
- **Consistent naming pattern** across all products

### For Business
- **Cleaner reports** and exports
- **Better user experience** for staff
- **Easier product management** and identification

## 🔍 How to Use

### In Queries
```sql
-- Get products by abbreviated name
SELECT * FROM park_product WHERE product_name = 'SER-NR-16+';

-- Get readable view with full details
SELECT * FROM park_product_readable WHERE abbreviated_name = 'SER-NR-16+';
```

### In Applications
- Use `product_name` for display (short, clean)
- Use `park_product_readable` view when you need full details
- The system automatically generates names for new products

## 📝 Adding New Parks/Entry Types/Age Groups

When adding new items, follow these rules:
1. **Parks**: Use first 3-4 letters, uppercase
2. **Entry Types**: Use first 2-3 letters, uppercase
3. **Age Groups**: Use descriptive abbreviations (16+, 5-15, etc.)

## 🚀 Future Enhancements

- **QR Code generation** for each product name
- **Barcode integration** for physical tickets
- **API endpoints** for name generation
- **Bulk import tools** with automatic naming

---

*This naming system was implemented to improve the user experience and system performance while maintaining clarity and consistency across all park products.*
