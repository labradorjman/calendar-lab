import { DateFormat, ParsedDateParts } from "@/types/dateFormat";
import { Meridiem } from "@/types/meridiem";
import { parse, isValid } from "date-fns";

export function parseIsoDateParts(
    iso: string,
    format: DateFormat
): ParsedDateParts {
    const date = new Date(iso);

    if (isNaN(date.getTime())) {
        throw new Error("Invalid ISO date");
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    let formattedDate: string;

    switch (format) {
        case "yyyy/MM/dd":
            formattedDate = `${year}/${month}/${day}`;
        break;
        case "dd/MM/yyyy":
            formattedDate = `${day}/${month}/${year}`;
        break;
        case "MM/dd/yyyy":
            formattedDate = `${month}/${day}/${year}`;
        break;
    }

    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const meridiem: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";
    const hour12 = hours24 % 12 || 12;

    const time12 = `${String(hour12).padStart(2, "0")}:${minutes}`;

    return {
        formattedDate,
        time12,
        meridiem,
    };
}

export function parseDateFromInput(value: string, format: string): Date | null {
    const parsedDate = parse(value, format, new Date()); 
    
    return isValid(parsedDate) ? parsedDate : null;
}