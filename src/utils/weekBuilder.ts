export function buildMonthDates(year: number, month: number): Date[] {
    // month is 1-based
    const firstOfMonth = new Date(year, month - 1, 1);

    // convert JS Sunday=0 → Monday=0
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;

    // get grid start date (first Monday shown)
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - mondayOffset);

    // build 42 cells (6 weeks)
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
    });
}
