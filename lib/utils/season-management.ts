/**
 * Season Management Utilities
 * Functions to handle hotel seasons, especially for managing past seasons
 */

export interface SeasonData {
  id: number;
  season_name: string;
  start_date: string;
  end_date: string;
  hotel_id: number;
}

export interface SeasonStatus {
  status: 'active' | 'upcoming' | 'past';
  daysUntilStart?: number;
  daysUntilEnd?: number;
  daysSinceEnd?: number;
}

/**
 * Get the status of a season based on current date
 */
export function getSeasonStatus(startDate: string, endDate: string): SeasonStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceEnd = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
  
  if (now < start) {
    return {
      status: 'upcoming',
      daysUntilStart
    };
  } else if (now > end) {
    return {
      status: 'past',
      daysSinceEnd
    };
  } else {
    return {
      status: 'active',
      daysUntilEnd
    };
  }
}

/**
 * Check if a season is in the past
 */
export function isSeasonPast(startDate: string, endDate: string): boolean {
  const now = new Date();
  const end = new Date(endDate);
  return now > end;
}

/**
 * Get the year of a season
 */
export function getSeasonYear(startDate: string): number {
  return new Date(startDate).getFullYear();
}

/**
 * Copy a season to the next year
 */
export function copySeasonToNextYear(season: SeasonData, targetYear?: number): SeasonData {
  const startDate = new Date(season.start_date);
  const endDate = new Date(season.end_date);
  
  const year = targetYear || startDate.getFullYear() + 1;
  
  startDate.setFullYear(year);
  endDate.setFullYear(year);
  
  return {
    ...season,
    id: 0, // New ID will be assigned by database
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  };
}

/**
 * Adjust season dates to current year (rolling year logic)
 */
export function adjustSeasonToCurrentYear(season: SeasonData): SeasonData {
  const startDate = new Date(season.start_date);
  const endDate = new Date(season.end_date);
  const currentYear = new Date().getFullYear();
  
  startDate.setFullYear(currentYear);
  endDate.setFullYear(currentYear);
  
  return {
    ...season,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  };
}

/**
 * Create a season template for recurring seasons
 */
export function createSeasonTemplate(
  name: string,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  hotelId: number,
  year: number
): SeasonData {
  const startDate = new Date(year, startMonth - 1, startDay);
  const endDate = new Date(year, endMonth - 1, endDay);
  
  return {
    id: 0,
    season_name: name,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    hotel_id: hotelId
  };
}

/**
 * Generate seasons for multiple years
 */
export function generateSeasonsForYears(
  name: string,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  hotelId: number,
  startYear: number,
  endYear: number
): SeasonData[] {
  const seasons: SeasonData[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    seasons.push(createSeasonTemplate(name, startMonth, startDay, endMonth, endDay, hotelId, year));
  }
  
  return seasons;
}

/**
 * Get past seasons that can be copied
 */
export function getPastSeasons(seasons: SeasonData[]): SeasonData[] {
  return seasons.filter(season => isSeasonPast(season.start_date, season.end_date));
}

/**
 * Get seasons by year
 */
export function getSeasonsByYear(seasons: SeasonData[], year: number): SeasonData[] {
  return seasons.filter(season => getSeasonYear(season.start_date) === year);
}

/**
 * Format date for display
 */
export function formatSeasonDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get season duration in days
 */
export function getSeasonDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if seasons overlap
 */
export function doSeasonsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 <= e2 && s2 <= e1;
}

/**
 * Validate season dates
 */
export function validateSeasonDates(startDate: string, endDate: string): {
  isValid: boolean;
  error?: string;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return {
      isValid: false,
      error: "End date must be after start date"
    };
  }
  
  if (start < new Date()) {
    return {
      isValid: false,
      error: "Start date cannot be in the past"
    };
  }
  
  return { isValid: true };
} 