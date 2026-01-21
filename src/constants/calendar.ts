export const HOUR_HEIGHT = 100;
export const HEADER_HEIGHT = 40;
export const TIME_COLUMN_WIDTH = 45;
export const SNAP_MINS = 15;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthName = (typeof MONTH_NAMES)[number];

export function getMonthName(month: number): MonthName {
    if(month <= 0 || month > MONTH_NAMES.length) {
        console.error(`Month value is invalid: ${month}. Returning January as default fallback.`);
        return "January";
    }
    return MONTH_NAMES[month - 1];
}

export const WEEK_DAYS = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];
