import { HOUR_HEIGHT } from "@/constants/column";

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

export function get24HourMinuteFromOffset(
    offset: number,
    minuteInterval: number,
) {
    const snapDist = HOUR_HEIGHT / (60 / minuteInterval);

    const hour24 = Math.floor(offset / HOUR_HEIGHT);
    const remainder = offset % HOUR_HEIGHT;
    const minute = minuteInterval * Math.floor(remainder / snapDist);

    return {
        hour24,
        minute,
    };
}