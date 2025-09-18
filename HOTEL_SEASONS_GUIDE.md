# Hotel Seasons Management Guide

## Overview

This guide explains how to manage hotel seasons, particularly when dealing with seasons that have passed their dates and need to be reused for the next year.

## Understanding Hotel Seasons

Hotel seasons are time periods with specific pricing structures. They typically include:
- **Peak Season**: High-demand periods with higher rates
- **Low Season**: Low-demand periods with lower rates  
- **Shoulder Season**: Transitional periods with moderate rates
- **Holiday Season**: Special periods around holidays

## The Challenge: Past Seasons

When seasons have passed their end dates, you have several options:

1. **Copy to Next Year**: Create new seasons with the same dates but for the next year
2. **Rolling Year Logic**: Adjust existing seasons to the current year
3. **Template System**: Create reusable season templates
4. **Bulk Operations**: Handle multiple seasons at once

## Approaches and Logic

### 1. Copy to Next Year Approach

**Use Case**: When you want to reuse exact date patterns from past seasons.

**Logic**:
```typescript
// Example: Copy "Peak Season 2024" to "Peak Season 2025"
const originalSeason = {
  name: "Peak Season",
  start_date: "2024-06-01",
  end_date: "2024-08-31"
};

const newSeason = {
  name: "Peak Season", 
  start_date: "2025-06-01", // Same month/day, next year
  end_date: "2025-08-31"
};
```

**Benefits**:
- Preserves exact date patterns
- Maintains season consistency
- Easy to understand and manage

**When to Use**:
- Annual recurring seasons
- When you want to keep the same date ranges
- For seasonal businesses with predictable patterns

### 2. Rolling Year Logic

**Use Case**: When you want to adjust past seasons to the current year.

**Logic**:
```typescript
// Example: Adjust "Peak Season 2023" to "Peak Season 2024"
const currentYear = new Date().getFullYear(); // 2024

const adjustedSeason = {
  name: "Peak Season",
  start_date: "2024-06-01", // Updated to current year
  end_date: "2024-08-31"
};
```

**Benefits**:
- Keeps seasons current
- Automatically adjusts to the current year
- Useful for ongoing operations

**When to Use**:
- When you want to keep seasons current
- For businesses that need up-to-date season information
- When you want to avoid having past seasons in your system

### 3. Template System

**Use Case**: When you want to create reusable season patterns.

**Logic**:
```typescript
// Create a template for "Peak Season"
const peakSeasonTemplate = {
  name: "Peak Season",
  startMonth: 6,  // June
  startDay: 1,
  endMonth: 8,    // August  
  endDay: 31
};

// Generate seasons for multiple years
const seasons = generateSeasonsForYears(
  "Peak Season", 6, 1, 8, 31, hotelId, 2024, 2026
);
```

**Benefits**:
- Reusable across multiple years
- Consistent season patterns
- Easy to maintain

**When to Use**:
- When you have predictable season patterns
- For multi-year planning
- When you want to ensure consistency

## Implementation in Your System

### Using the Season Management Utilities

The system includes utility functions for managing seasons:

```typescript
import { 
  copySeasonToNextYear,
  adjustSeasonToCurrentYear,
  getSeasonStatus,
  isSeasonPast
} from '@/lib/utils/season-management';

// Check if a season is past
const isPast = isSeasonPast(season.start_date, season.end_date);

// Copy to next year
const newSeason = copySeasonToNextYear(season, 2025);

// Adjust to current year
const adjustedSeason = adjustSeasonToCurrentYear(season);
```

### Bulk Operations

For handling multiple seasons:

1. **Select Seasons**: Use checkboxes to select multiple seasons
2. **Copy to Next Year**: Bulk copy selected seasons
3. **Adjust to Current Year**: Bulk adjust selected seasons
4. **Delete**: Bulk delete selected seasons

### Individual Season Actions

For single seasons:

1. **Edit**: Modify season details
2. **Copy to Next Year**: Create a copy for the next year
3. **Delete**: Remove the season

## Best Practices

### 1. Season Naming Convention

Use consistent naming patterns:
- `Peak Season 2024`
- `Low Season 2024`
- `Holiday Season 2024`

### 2. Date Validation

Always validate season dates:
- End date must be after start date
- Avoid overlapping seasons for the same hotel
- Consider leap years for February dates

### 3. Year Management

- Keep track of season years
- Use clear year indicators in season names
- Consider using templates for recurring patterns

### 4. Bulk Operations

- Use bulk operations for efficiency
- Preview changes before applying
- Provide clear feedback on operations

## Common Scenarios

### Scenario 1: Annual Hotel Seasons

**Situation**: You have hotel seasons that repeat annually with the same dates.

**Solution**: Use the "Copy to Next Year" approach.

**Steps**:
1. Select past seasons
2. Use "Copy to Next Year" bulk operation
3. Review and confirm the new seasons

### Scenario 2: Rolling Seasons

**Situation**: You want to keep seasons current and avoid having past seasons.

**Solution**: Use the "Rolling Year" approach.

**Steps**:
1. Select seasons to update
2. Use "Adjust to Current Year" bulk operation
3. Seasons are updated to current year

### Scenario 3: Template-Based Seasons

**Situation**: You want to create consistent season patterns across multiple years.

**Solution**: Use season templates.

**Steps**:
1. Create season templates
2. Generate seasons for multiple years
3. Apply templates to hotels

## Database Considerations

### Season Table Structure

```sql
CREATE TABLE hotels_seasons (
  id SERIAL PRIMARY KEY,
  season_name VARCHAR NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  hotel_id INT NOT NULL,
  -- Additional fields as needed
);
```

### Constraints

- Unique constraint on hotel_id + start_date + end_date
- Check constraint to ensure end_date > start_date
- Foreign key to hotels table

### Indexes

```sql
CREATE INDEX idx_hotels_seasons_hotel_id ON hotels_seasons(hotel_id);
CREATE INDEX idx_hotels_seasons_dates ON hotels_seasons(start_date, end_date);
```

## Troubleshooting

### Common Issues

1. **Overlapping Seasons**
   - Check for date overlaps before creating new seasons
   - Use validation functions to prevent conflicts

2. **Date Format Issues**
   - Ensure consistent date format (ISO 8601)
   - Handle timezone considerations

3. **Bulk Operation Failures**
   - Check database constraints
   - Verify data integrity
   - Use transaction rollback for failed operations

### Error Handling

```typescript
try {
  const result = await copySeasonsToNextYear(seasons);
  // Handle success
} catch (error) {
  if (error.code === '23505') {
    // Handle unique constraint violation
  } else if (error.code === '23503') {
    // Handle foreign key constraint violation
  }
  // Handle other errors
}
```

## Future Enhancements

### Potential Improvements

1. **Season Templates**: Create reusable season patterns
2. **Auto-Generation**: Automatically generate seasons for future years
3. **Season Analytics**: Track season performance and trends
4. **Integration**: Connect with pricing and booking systems

### Advanced Features

1. **Season Cloning**: Clone seasons with modifications
2. **Season Archiving**: Archive old seasons instead of deleting
3. **Season Scheduling**: Schedule season creation in advance
4. **Season Notifications**: Notify when seasons are approaching

## Conclusion

Managing hotel seasons effectively requires understanding your business needs and choosing the right approach. The system provides multiple tools to handle past seasons and create new ones efficiently. Use the approach that best fits your operational requirements and business model. 