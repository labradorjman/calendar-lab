export function getNextDates(startDate: Date, amount: number): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < amount; i++) {
        const nextDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + i);
        dates.push(nextDate);
    }

    return dates;
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
