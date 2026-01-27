export class CalendarDateBuilder {
    private readonly unixSeconds: number;

    constructor(unixSeconds: number) {
        this.unixSeconds = unixSeconds;
    }

    addSeconds(seconds: number): CalendarDateBuilder {
        return new CalendarDateBuilder(this.unixSeconds + seconds);
    }

    addMinutes(minutes: number): CalendarDateBuilder {
        return this.addSeconds(minutes * 60);
    }

    addHours(hours: number): CalendarDateBuilder {
        return this.addSeconds(hours * 3600);
    }

    // Final output
    get UnixSeconds(): number {
        return this.unixSeconds;
    }

    toISOString(): string {
        return new Date(this.unixSeconds * 1000).toISOString();
    }

    toDate(): Date {
        return new Date(this.unixSeconds * 1000);
    }
}
