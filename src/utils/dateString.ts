export function getDateString(year: number, month: number, date: number): string {
    return `${year}-${month}-${date}`;
}

export function getYearMonthDay(dateString: string): { year: number, month: number, day: number } {
    const today = new Date();
    const todayDate = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
    }

    const values = dateString.split("-");

    if (values.length !== 3) {
        console.error(`${dateString} does not follow yyyy-mm-dd format.`);
        return todayDate;
    }

    const year = Number(values[0]);
    const month = Number(values[1]);
    const day = Number(values[2]);

    if (!Number.isInteger(year) || year < 1) {
        console.error("Invalid year.");
        return todayDate;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        console.error("Invalid month. The month uses a 1 - 12 index.");
        return todayDate;
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
        console.error("Invalid day.");
        return todayDate;
    }

    return { year, month, day };
}