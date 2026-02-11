import { CalendarDateBuilder } from "./CalendarDateBuilder";

type CalendarDateProps =
  | { format: "postgres"; postgresTimestamptz: string; timezone?: string }
  | { format: "date"; date: Date; timezone?: string };

export class CalendarDate {
    private date: Date;
    private postgresTimestamp: string;

    public unixSeconds!: number;
    public tzOffsetSeconds!: number;
    public startSeconds!: number;
    public endSeconds!: number;

    public timezone: string;

    constructor(props: CalendarDateProps) {
        this.timezone = normalizeTimeZone(props.timezone);

        let date: Date;

        if (props.format === "postgres") {
            assertPostgresTimestamptz(props.postgresTimestamptz);

            this.postgresTimestamp = props.postgresTimestamptz;

            date = parsePostgresTimestamptz(props.postgresTimestamptz);
            this.date = date;
        } else if (props.format === "date") {
            date = props.date;
            this.date = date;
            this.postgresTimestamp = date.toISOString();
        } else {
            throw new Error("Unsupported format");
        }

        this.unixSeconds = Math.floor(date.getTime() / 1000);
        this.startSeconds = this.unixSeconds;
        this.endSeconds = getEndOfDayInSeconds(date, this.timezone);

        this.tzOffsetSeconds = getTimezoneOffsetSeconds(date, this.timezone);
    }

    /**
    * Creates an independent time converter based off CalenderDate start unix
    */
    builder(): CalendarDateBuilder {
        return new CalendarDateBuilder(this.unixSeconds);
    }

    get startLocalSeconds(): number {
        return this.startSeconds + this.tzOffsetSeconds;
    }

    get endLocalSeconds(): number {
        return this.endSeconds + this.tzOffsetSeconds;
    }

    get startLocalDate(): Date {
        return new Date(this.startLocalSeconds * 1000);
    }

    get endLocalDate(): Date {
        return new Date(this.endLocalSeconds * 1000);
    }
}

function parsePostgresTimestamptz(ts: string): Date {
    // Convert " " to "T" and ensure timezone offset
    // Example: "2026-02-11 15:30:00+00" => "2026-02-11T15:30:00+00:00"
    const isoString = ts.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
    return new Date(isoString);
}


function isPostgresTimestamptz(value: string): boolean {
    const regex =
        /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)$/;
    return regex.test(value) && isValidDateString(value);
}

function assertPostgresTimestamptz(value: string): void {
    if (!isPostgresTimestamptz(value)) throw new Error("Invalid Postgres timestamptz");
}

function isValidDateString(value: string): boolean {
    return !Number.isNaN(new Date(value).getTime());
}

function isValidTimeZone(tz: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

function normalizeTimeZone(tz?: string): string {
    return tz && isValidTimeZone(tz) ? tz : "UTC";
}

function getTimezoneOffsetSeconds(date: Date, timeZone: string): number {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 1000);
}

function getEndOfDayInSeconds(date: Date, timeZone: string): number {
    const nextDay = new Date(
        new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date)
    );
    nextDay.setDate(nextDay.getDate() + 1);
    return Math.floor(nextDay.getTime() / 1000);
}
