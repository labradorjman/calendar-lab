// import { HOUR_HEIGHT } from "@/constants/column";

import { HOUR_HEIGHT } from "@/constants/column";

// function getHourParts(hour: number) {
//     const isPM = Math.floor(hour / 12) % 2 === 1;
//     const hourValue = hour % 12 === 0 ? 12 : hour % 12;

//     return {
//         hourValue,
//         suffix: isPM ? "PM" : "AM",
//     };
// }

// export function getHourString(hour: number, includeSuffix?: boolean): string {
//     const { hourValue, suffix } = getHourParts(hour);
//     return includeSuffix ? `${hourValue} ${suffix}` : hourValue.toString();
// }

// /**
//  * Convert a 24-hour time string "HH:MM" to 12-hour format with optional suffix
//  * @param time24 - string in "HH:MM" format
//  * @param includeSuffix - whether to include "AM"/"PM" (default true)
//  * @returns string like "12:15 AM" or "12:15"
//  */
// export function to12HourTimeFromString(
//     time24: string,
//     includeSuffix = true
// ): string {
//     const [hourStr, minuteStr] = time24.split(":");
//     const hour24 = parseInt(hourStr, 10);
//     const minute = parseInt(minuteStr, 10);

//     if (isNaN(hour24) || isNaN(minute) || hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) {
//         throw new Error(`Invalid 24-hour time string: ${time24}`);
//     }

//     const suffix = hour24 >= 12 ? "PM" : "AM";
//     const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
//     const minutePadded = minute.toString().padStart(2, "0");

//     return includeSuffix ? `${hour12}:${minutePadded} ${suffix}` : `${hour12}:${minutePadded}`;
// }

/**
 * Convert Unix seconds to Postgres timestamptz string
 * @param unixSeconds - seconds since 1970-01-01 UTC
 * @param timeZone - optional IANA timezone (default = local)
 * @returns string like "2026-01-22 21:30:00+11"
 */
export function unixToPostgresTimestamptz(
    unixSeconds: number,
    timeZone?: string
): string {
    const date = new Date(unixSeconds * 1000);

    // Use Intl.DateTimeFormat to get YYYY-MM-DD HH:MM:SS and offset
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = dtf.formatToParts(date);

    const y = parts.find(p => p.type === "year")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    const d = parts.find(p => p.type === "day")?.value;
    const h = parts.find(p => p.type === "hour")?.value;
    const min = parts.find(p => p.type === "minute")?.value;
    const s = parts.find(p => p.type === "second")?.value;

    const tzOffsetMinutes = timeZone
        ? -(date.getTimezoneOffset()) // fallback: local TZ
        : -date.getTimezoneOffset();
    const offsetSign = tzOffsetMinutes >= 0 ? "+" : "-";
    const offsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60)
        .toString()
        .padStart(2, "0");
    const offsetMinutes = (Math.abs(tzOffsetMinutes) % 60).toString().padStart(2, "0");

    return `${y}-${m}-${d} ${h}:${min}:${s}${offsetSign}${offsetHours}${offsetMinutes}`;
}

/**
 * Convert a Postgres timestamptz string to Unix seconds
 * @param timestamptz - string like "2026-01-22 21:30:00+1100"
 * @returns Unix timestamp in seconds
 */
export function postgresTimestamptzToUnix(timestamptz: string): number {
    const isoString = timestamptz.replace(
        /([+-]\d{2})(\d{2})$/,
        (_, h, m) => `${h}:${m}`
    ).replace(" ", "T");

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamptz string: ${timestamptz}`);
    }

    return Math.floor(date.getTime() / 1000);
}

export function get24HourMinute(
    dividend: number,
    minuteInterval: number,
) {
    const snapDist = HOUR_HEIGHT / (60 / minuteInterval);

    const hour24 = Math.floor(dividend / HOUR_HEIGHT);
    const remainder = dividend % HOUR_HEIGHT;
    const minute = minuteInterval * Math.floor(remainder / snapDist);

    return {
        hour24,
        minute,
    };
}

/**
 * Convert a Postgres timestamptz string to Unix seconds
 * @param seconds - Number of seconds since the start of the day column
 * @returns top offset required by task conatiner
 */

// export function unixToHourString(unixSeconds: number, includeSuffix = true): string {
//     const date = new Date(unixSeconds * 1000);

//     let hours = date.getHours();
//     const suffix = hours >= 12 ? "PM" : "AM";

//     hours = hours % 12;
//     if (hours === 0) hours = 12;

//     return includeSuffix ? `${hours} ${suffix}` : hours.toString();
// }