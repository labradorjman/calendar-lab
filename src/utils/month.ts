import { Calendar } from "tsg-calendar-lib";
import { getDateString } from "./dateString";

export function shiftMonth(
    year: number,
    month: number,
    delta: -1 | 0 | 1
): { year: number; month: number } {
    let newMonth = month + delta;

    if (newMonth < 1) {
        newMonth += 12;
        year -= 1;
    } else if (newMonth > 12) {
        newMonth -= 12;
        year += 1;
    }

    return { year, month: newMonth };
}

type MonthDelta = -1 | 0 | 1;
type AdjacentMonthDays<D extends MonthDelta> = {
  delta: D;
  days: number[];
  dates: string[];
};

export function getAdjacentMonthDays(
    year: number,
    month: number
): [
    AdjacentMonthDays<-1>,
    AdjacentMonthDays<0>,
    AdjacentMonthDays<1>
] {
    const currentCalendar = new Calendar(year, month);

    const { year: prevYear, month: prevMonth } = shiftMonth(year, month, - 1);
    const { year: nextYear, month: nextMonth } = shiftMonth(year, month, 1);

    const prevCalendar = new Calendar(prevYear, prevMonth);
    const nextCalendar = new Calendar(nextYear, nextMonth);

    const filteredCurrentDays = currentCalendar.FullCalendarData.flat().filter(day => day !== 0);
    const filteredPrevDays = prevCalendar.FullCalendarData.flat().filter(day => day !== 0);
    const filteredNextDays = nextCalendar.FullCalendarData.flat().filter(day => day !== 0);

    return [
        {
            delta: -1,
            days: filteredPrevDays,
            dates: filteredPrevDays.map(day => getDateString(prevCalendar.CurrentYear, prevMonth, day)),
        },
        {
            delta: 0,
            days: filteredCurrentDays,
            dates: filteredCurrentDays.map(day => getDateString(currentCalendar.CurrentYear, month, day)),
        },
        {
            delta: 1,
            days:filteredNextDays,
            dates: filteredNextDays.map(day => getDateString(nextCalendar.CurrentYear, nextMonth, day)),
        },
    ]
}

