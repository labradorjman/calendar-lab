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