export class HourTime {
    private hour24: number;
    private minute: number;
    private suffix: "AM" | "PM";

    constructor(hour24: number, minute = 0) {
        if (hour24 < 0 || hour24 > 23) {
            throw new Error("Hour must be 0–23");
        }
        if (minute < 0 || minute > 59) {
            throw new Error("Minute must be 0–59");
        }

        this.hour24 = hour24;
        this.minute = minute;
        this.suffix = hour24 < 12 ? "AM" : "PM";
    }

    get Time24(): string {
        return `${this.hour24.toString().padStart(2, "0")}:${this.minute.toString().padStart(2, "0")}`;
    }

    get Hour12(): string {
        return `${this.hour24 % 12 || 12}`;
    }

    get Hour12WithSuffix(): string {
        return `${this.Hour12} ${this.suffix}`;
    }

    get Time12(): string {
        return `${this.Hour12}:${this.minute.toString().padStart(2, "0")}`;
    }

    get Time12WithSuffix(): string {
        return `${this.Hour12}:${this.minute.toString().padStart(2, "0")} ${this.suffix}`;
    }

    toSecondsSince(referenceHour24 = 0): number {
        const deltaHours =
            (this.hour24 - referenceHour24 + 24) % 24;

        return deltaHours * 3600 + this.minute * 60;
    }

    static fromUnix(unixSeconds: number): HourTime {
        const date = new Date(unixSeconds * 1000);

        const hour24 = date.getUTCHours();
        const minute = date.getUTCMinutes();

        return new HourTime(hour24, minute);
    }
}
