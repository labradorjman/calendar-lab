import { Meridiem } from "@/types/meridiem";

export class HourTime {
    private hour24: number;
    private minute: number;
    private suffix: Meridiem;

    constructor(hour: number, minute = 0, suffix?: Meridiem) {
        if (minute < 0 || minute > 59) {
            throw new Error("Minute must be 0–59");
        }

        if (suffix) {

        // 12hr
        if (hour < 1 || hour > 12) {
            throw new Error("Hour must be 1–12 for 12-hour format");
        }
            this.hour24 = suffix === "AM" ? (hour % 12) : ((hour % 12) + 12);
            this.suffix = suffix;
        } else {

        // 24hr
        if (hour < 0 || hour > 23) {
            throw new Error("Hour must be 0–23 for 24-hour format");
        }
            this.hour24 = hour;
            this.suffix = hour < 12 ? "AM" : "PM";
        }

        this.minute = minute;
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

    static from12Hour(hour12: number, minute: number, suffix: Meridiem): HourTime {
        return new HourTime(hour12, minute, suffix);
    }
}
