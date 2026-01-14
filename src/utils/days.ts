import { getYearMonthDay } from "./dateString";
import { getAdjacentMonthDays } from "./month";

export function getNextDates(startDate: string, amount: number): string[] {
    const { year, month, day } = getYearMonthDay(startDate);

    const startIndex = day - 1;
    const days: string[] = [];
    const [ _, currentMonthDays, nextMonthDays ] = getAdjacentMonthDays(year, month);

    for (let i = 0; i < amount; i++) {
        const index = startIndex + i;
        if (index < currentMonthDays.dates.length) {
            days.push(currentMonthDays.dates[index]);
        } else {
            const nextMonthIndex = index - currentMonthDays.dates.length;
            days.push(nextMonthDays.dates[nextMonthIndex]);
        }
    }

    return days;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

export function shiftDay(
    year: number,
    month: number,
    day: number,
    delta: -1 | 0 | 1
): { year: number; month: number; day: number } {
    let newDay = day + delta;
    let newMonth = month;
    let newYear = year;

    if (newDay < 1) {
        newMonth -= 1;

        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }

        newDay = getDaysInMonth(newYear, newMonth);
    } else {
        const daysInMonth = getDaysInMonth(newYear, newMonth);

        if (newDay > daysInMonth) {
            newDay = 1;
            newMonth += 1;

            if (newMonth > 12) {
                newMonth = 1;
                newYear += 1;
            }
        }
    }

    return { year: newYear, month: newMonth, day: newDay };
}
