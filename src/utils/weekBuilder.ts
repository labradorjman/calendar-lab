import type { Calendar } from "tsg-calendar-lib";
import type { MonthBlock } from "../types/monthBlock";

export function toMondayMonthBlock(calendar: Calendar): MonthBlock {
    const sundayDays = calendar.FullCalendarData.flat();

    let result: number[];
    if (sundayDays[0] === 1) {
        const firstWeek = [...Array(6).fill(0), sundayDays[0]];
        const rest = sundayDays.slice(1);

        result = [...firstWeek, ...rest];
    } else {
        result = [...sundayDays.slice(1), sundayDays[0]];
    }

    const zerosToAdd = 42 - result.length;
    if (zerosToAdd > 0) {
        result = [...result, ...Array(zerosToAdd).fill(0)];
    }

    const prevMonth = calendar.previous();
    const previousDays = prevMonth.GetNumberOfDaysInMonth(prevMonth.CurrentYear, prevMonth.CurrentMonth);

    const firstDayIndex = result.indexOf(1);
    for (let i = 0; i < firstDayIndex; i++) {
        result[i] = previousDays - firstDayIndex + 1 + i;
    }

    const lastDayIndex = result.indexOf(0, firstDayIndex);

    for (let i = lastDayIndex; i < result.length; i++) {
        result[i] = i - lastDayIndex + 1;
    }
    
    return {
        days: result,
        startIndex: firstDayIndex,
        endIndex: lastDayIndex - 1,
    };
}
