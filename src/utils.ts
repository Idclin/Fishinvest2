import { FishType, LEVEL_RULES } from './types.ts';

/**
 * Returns the exact pro-rated earnings specified in the user request.
 */
export function getProRatedEarnings(fishType: FishType, day: string, customDailyProfit?: number): number {
  const normalizedDay = day.trim().toLowerCase();

  const dayMap: Record<string, string> = {
    mon: 'monday', monday: 'monday',
    tue: 'tuesday', tuesday: 'tuesday',
    wed: 'wednesday', wednesday: 'wednesday',
    thu: 'thursday', thursday: 'thursday',
    fri: 'friday', friday: 'friday',
    sat: 'saturday', saturday: 'saturday',
    sun: 'sunday', sunday: 'sunday'
  };

  const DayKey = dayMap[normalizedDay] || 'monday';

  const daysMap: Record<string, number> = {
    monday: 6, tuesday: 5, wednesday: 4, thursday: 3, friday: 2, saturday: 1, sunday: 0
  };
  const daysRemaining = daysMap[DayKey] ?? 0;

  if (customDailyProfit !== undefined) {
    return Math.round(customDailyProfit * daysRemaining);
  }

  // default rates fallback for legacy compatibility
  const matrix: Record<string, Record<string, number>> = {
    meluza: { monday: 300, tuesday: 250, wednesday: 200, thursday: 150, friday: 100, saturday: 50, sunday: 0 },
    schoolbian: { monday: 700, tuesday: 583, wednesday: 467, thursday: 350, friday: 233, saturday: 117, sunday: 0 },
    catfish: { monday: 1400, tuesday: 1167, wednesday: 933, thursday: 700, friday: 467, saturday: 233, sunday: 0 }
  };

  const dayYields = matrix[fishType];
  if (dayYields) {
    return dayYields[DayKey] ?? 0;
  }

  // general formula
  const defaultDailyProfits: Record<string, number> = {
    meluza: 50,
    schoolbian: 116.67,
    catfish: 233.33
  };
  const daily = defaultDailyProfits[fishType] || 0;
  return Math.round(daily * daysRemaining);
}

/**
 * Returns the active days based on staked day.
 */
export function getActiveDays(day: string): number {
  const dayMap: Record<string, number> = {
    monday: 6, mon: 6,
    tuesday: 5, tue: 5,
    wednesday: 4, wed: 4,
    thursday: 3, thu: 3,
    friday: 2, fri: 2,
    saturday: 1, sat: 1,
    sunday: 0, sun: 0,
  };
  return dayMap[day.trim().toLowerCase()] ?? 0;
}

/**
 * Evaluates the farmer level based on lifetime total stakes (in NGN)
 */
export function evaluateUserLevel(lifetimeStaked: number) {
  for (const rule of LEVEL_RULES) {
    if (lifetimeStaked >= rule.minStaked) {
      return rule;
    }
  }
  return LEVEL_RULES[LEVEL_RULES.length - 1]; // Beginner Farmer fallback
}

/**
 * Formats a number to Nigerian Naira (₦) with custom decimal rules.
 */
export function formatNaira(amount: number, showDecimals: boolean = false): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  // Clean up currency output to be simple
  return formatter.format(amount).replace('NGN', '₦').replace('¤', '₦').trim();
}

/**
 * Resolves the absolute backend API URL.
 * Supports running the static frontend on Netlify or GitHub Pages while contacting the live Cloud Run backend.
 */
export function getApiUrl(path: string): string {
  // Ensure we format the path to start with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Automatically remember active backend origin if the app is loaded from there
  const host = window.location.hostname;
  const isBackendHost = 
    host.includes('run.app') || 
    host.includes('web-preview.aistudio') || 
    host.includes('europe-west2.run.app');

  if (isBackendHost) {
    try {
      localStorage.setItem('fishinvest_last_backend_url', window.location.origin);
    } catch (e) {
      // Ignore storage block errors
    }
    return cleanPath;
  }

  // 1. Explicit user override
  try {
    const override = localStorage.getItem('fishinvest_backend_url');
    if (override) {
      const cleanOverride = override.trim().replace(/\/$/, '');
      return `${cleanOverride}${cleanPath}`;
    }
  } catch (e) {}

  // 2. Relative if localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return cleanPath;
  }

  // 3. Stored auto-discovered backend URL from previous preview session
  try {
    const lastKnown = localStorage.getItem('fishinvest_last_backend_url');
    if (lastKnown) {
      return `${lastKnown.replace(/\/$/, '')}${cleanPath}`;
    }
  } catch (e) {}

  // 4. Fallback to active applet shared Cloud Run deployment
  const defaultBackend = 'https://ais-pre-wxa7usscgspomn6irqvlhe-245051637466.europe-west2.run.app';
  return `${defaultBackend}${cleanPath}`;
}
