import { HOUR_HEIGHT } from "@/constants/calendar";

function getHourParts(hour: number) {
    const isPM = Math.floor(hour / 12) % 2 === 1;
    const hourValue = hour % 12 === 0 ? 12 : hour % 12;

    return {
        hourValue,
        suffix: isPM ? "PM" : "AM",
    };
}

export function getHourString(hour: number, includeSuffix?: boolean): string {
    const { hourValue, suffix } = getHourParts(hour);
    return includeSuffix ? `${hourValue} ${suffix}` : hourValue.toString();
}

export function getHourMinuteString(
    dividend: number,
    minuteInterval: number,
    includeSuffix?: boolean
) {
    const snapDist = HOUR_HEIGHT / (60 / minuteInterval);

    const hour = Math.floor(dividend / HOUR_HEIGHT);
    const { hourValue, suffix } = getHourParts(hour);

    const remainder = dividend % HOUR_HEIGHT;
    const minuteValue =
        minuteInterval * Math.floor(remainder / snapDist);

    const minutes = minuteValue.toString().padStart(2, "0");

    return includeSuffix
        ? `${hourValue}:${minutes} ${suffix}`
        : `${hourValue}:${minutes}`;
}