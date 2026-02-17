import { DateFormat } from "@/types/dateFormat";

export const TIMEZONE = "Australia/Sydney";
export const USER_ID = 1;
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;
export const DATE_FORMAT: DateFormat = "yyyy/MM/dd";

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
    if (month <= 0 || month > MONTH_NAMES.length) {
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
