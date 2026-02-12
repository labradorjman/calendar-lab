import { DateFormat } from "@/types/dateFormat";
import { parse, isValid } from "date-fns";

export function todayUtc(): Date {
    const now = new Date();

    return createUtcDate(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );
}

export function createUtcDate(
    year: number,
    month: number,
    day: number,
    hours = 0,
    minutes = 0,
    seconds = 0,
    ms = 0
): Date {
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms));
}

export function dateToKey (date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getDateString(year: number, month: number, date: number): string {
    return `${year}-${month.toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`;
}

export function getDateStringFromDate(date: Date, format: DateFormat = "yyyy/MM/dd"): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    switch (format) {
        case "yyyy/MM/dd":
            return `${year}-${month}-${day}`;
        case "dd/MM/yyyy":
            return `${day}/${month}/${year}`;
        case "MM/dd/yyyy":
            return `${month}/${day}/${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

export function getYearMonthDay(date: Date): { year: number; month: number; day: number } {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
}

export function isValidYMD(dateStr: string): boolean {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr);
    if (!match) return false;

    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);

    return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
    );
}

export function getSegmentsForFormat(format: DateFormat) {
  switch (format) {
    case "yyyy/MM/dd":
        return [
            { name: "year", start: 0, end: 4 },
            { name: "month", start: 5, end: 7 },
            { name: "day", start: 8, end: 10 },
        ];
    case "dd/MM/yyyy":
        return [
            { name: "day", start: 0, end: 2 },
            { name: "month", start: 3, end: 5 },
            { name: "year", start: 6, end: 10 },
        ];
    case "MM/dd/yyyy":
        return [
            { name: "month", start: 0, end: 2 },
            { name: "day", start: 3, end: 5 },
            { name: "year", start: 6, end: 10 },
        ];
    default:
      throw new Error(`Unsupported date format: ${format}`);
  }
}

export function parseDateFromInput(value: string, format: string): Date | null {
    const parsedDate = parse(value, format, new Date()); 
    
    return isValid(parsedDate) ? parsedDate : null;
}
