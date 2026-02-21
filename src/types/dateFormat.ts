import { Meridiem } from "./meridiem";

export type DateFormat = "yyyy/MM/dd" | "dd/MM/yyyy" | "MM/dd/yyyy";

export type ParsedDateParts = {
  formattedDate: string;
  time12: string;
  meridiem: Meridiem;
};