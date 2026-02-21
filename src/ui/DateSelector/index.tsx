"use client";

import styles from "./DateSelector.module.scss";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import CalendarIcon from '@/assets/icons/calendar.webp';
import { DATE_FORMAT, getMonthName, MAX_YEAR, MIN_YEAR } from "@/constants/calendar";
import Button from "../Button";
import MaskedInput from "../MaskedInput";
import { useSmartFloating } from "@/hooks/useSmartFloating";
import CalendarGrid from "../CalendarGrid";
import { YearMonthState } from "@/types/yearMonthState";
import { getDateStringFromDate, getSegmentsForFormat, getSlashPositions, getYearMonthDay } from "@/utils/date";
import { shiftMonth } from "@/utils/month";
import { ClearableHandle } from "@/types/componentHandles";
import { parseDateFromInput } from "@/utils/dateParser";

interface DateSelectorProps {
    defaultValue?: string;
    onDateChange: (date: Date | null) => void;
}

const DateSelector = forwardRef<ClearableHandle, DateSelectorProps>(
    ({ defaultValue, onDateChange }, ref) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [date, setDate] = useState<Date | null>(null);
        const [dateStr, setDateStr] = useState<string>("");
        const [yearMonth, setYearMonth] = useState<YearMonthState>({
            year: today.getFullYear(),
            month: today.getMonth() + 1,
        });
        const [showCalendar, setShowCalendar] = useState(false);

        const inputRef = useRef<HTMLInputElement>(null);

        const referenceNode = useRef<HTMLElement | null>(null);
        const floatingNode = useRef<HTMLElement | null>(null);

        const { x, y, strategy, reference, floating } = useSmartFloating();

        const setReference = (node: HTMLElement | null) => {
            referenceNode.current = node;
            reference(node);
        };

        const setFloating = (node: HTMLElement | null) => {
            floatingNode.current = node;
            floating(node);
        };

        function handleClear() {
            setDateStr("");
            setDate(null);
        }

        useImperativeHandle(ref, () => ({
            clear: handleClear
        }));

        useEffect(() => {
            onDateChange(date);
        }, [date]);

        useEffect(() => {
            if (!defaultValue) return;

            setDateStr(defaultValue);

            const parsed = parseDateFromInput(defaultValue, DATE_FORMAT);
            setDate(parsed);
        }, [defaultValue]);

        useEffect(() => {
            function handleClickOutside(e: MouseEvent) {
                const target = e.target as Node;

                if (
                    referenceNode.current && 
                    !referenceNode.current.contains(target) &&
                    floatingNode.current &&
                    !floatingNode.current.contains(target)
                ) {
                    setShowCalendar(false);
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        function normalizeDateInput(value: string) {
            const slashPositions = getSlashPositions(DATE_FORMAT, false);
            const isSlashPosition = slashPositions.includes(value.length);
            if (isSlashPosition && !value.endsWith("/")) {
                return value + "/";
            }

            return value;
        }

        function completeDateInput(e: React.FocusEvent<HTMLInputElement>) {
            const value = e.target.value;
            if (!value) return "";

            const segments = getSegmentsForFormat(DATE_FORMAT);

            const input = e.target;
            const pos = Math.max(
                input.selectionStart ?? 0,
                input.selectionEnd ?? 0,
                0
            );

            // Only complete (fill in) and validate string if the user enters a value for the last segment
            if (pos < segments[segments.length - 1].start + 1) return value;
        
            const parts = value.split("/");
            const segmentNames = segments.map(s => s.name);

            let dayStr = parts[segmentNames.indexOf("day")!] ?? "";
            let monthStr = parts[segmentNames.indexOf("month")!] ?? "";
            let yearStr = parts[segmentNames.indexOf("year")!] ?? "";

            const today = new Date();

            const rawDay = Number(dayStr);
            const rawMonth = Number(monthStr);
            const rawYear = Number(yearStr);

            const month =
                Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
                    ? rawMonth
                    : today.getMonth() + 1;

            const year =
                Number.isInteger(rawYear) && rawYear >= MIN_YEAR && rawYear <= MAX_YEAR
                    ? rawYear
                    : today.getFullYear();

            const maxDays = new Date(year, month, 0).getDate();
            const day = 
                Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= maxDays
                    ? rawDay
                    : maxDays;
            
            const finalDate = segments.map(seg => {
                switch (seg.name) {
                    case "day":
                        return day.toString().padStart(seg.end - seg.start, "0");
                    case "month":
                        return month.toString().padStart(seg.end - seg.start, "0");
                    case "year":
                        return year;
                }
            }).join("/");

            return finalDate;
        }

        function handleBackspace(e: React.KeyboardEvent<HTMLInputElement>) {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? pos;

            if (pos !== end) {
                return;
            }

            // Positions after DD MM
            const slashPositions = getSlashPositions(DATE_FORMAT, true);
            const isAtSlashBoundary = slashPositions.includes(pos);

            if (isAtSlashBoundary) {
                e.preventDefault();
                setDateStr(prev => {
                    if(dateStr.endsWith("/")) {
                        return dateStr.slice(0, -1); 
                    }
                    return prev;
                });

                return;
            }
        }

        function handleTab(e: React.KeyboardEvent<HTMLInputElement>) {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;

            const chars = dateStr.split("");

            const segments = getSegmentsForFormat(DATE_FORMAT);
            let segment = segments.find(s => pos > s.start && pos <= s.end)
                || segments.find(s => pos + 1 > s.start && pos + 1 <= s.end);

            if (!segment) {
                console.error("Cannot find date segment for position:", pos);
                return;
            }

            const { name, start, end } = segment;
            const today = new Date();

            let tabValue = "";

            const isEmpty = start === chars.length;
            if (isEmpty) {
                switch (name) {
                    case "day":
                        tabValue = today.getDate().toString().padStart(2, "0");
                        break;
                    case "month":
                        tabValue = (today.getMonth() + 1).toString().padStart(2, "0");
                        break;
                    case "year":
                        tabValue = today.getFullYear().toString();
                        break;
                }
                e.preventDefault();
            } else {
                if (segment.end === 10) {
                    inputRef.current?.blur();
                    return;
                }

                e.preventDefault();

                tabValue = chars.slice(start, end).join("");
                if (name === "year") {
                    let yearValue = Number.parseInt(tabValue);
                    const currentYear = today.getFullYear().toString();

                    if (tabValue.length === 2) {
                        tabValue = currentYear.slice(0, 2) + tabValue;
                    } else {
                        tabValue =
                        yearValue < MIN_YEAR || yearValue > MAX_YEAR
                            ? currentYear
                            : tabValue;
                    }
                } else {
                    tabValue = tabValue === "0" ? "01" : tabValue.padStart(2, "0");
                }
            }

            const startValue = start > 0 ? chars.slice(0, start).join("") : "";
            const normalized = normalizeDateInput(`${startValue}${tabValue}`);
            setDateStr(normalized);
        }

        return (
            <div
                ref={setReference}
                className={styles.date_selector}
            >
                <MaskedInput
                    ref={inputRef}
                    mask={DATE_FORMAT === "yyyy/MM/dd" ? "dddd/dd/dd" : "dd/dd/dddd"}
                    placeholder={DATE_FORMAT.toLowerCase()}
                    value={dateStr}
                    onBlur={(e) => {
                        const completeStr = completeDateInput(e);
                        setDateStr(completeStr);

                        const parsed = parseDateFromInput(completeStr, DATE_FORMAT);
                        setDate(parsed);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                            handleBackspace(e);
                        } else if (e.key === "Tab") {
                            handleTab(e);
                        }
                    }}
                    onChange={(value) => {
                        const normalized = normalizeDateInput(value);
                        setDateStr(normalized);
                    }}

                />
                <div className={styles.icon_area}>
                    <Button
                        element="button"
                        variant="transparent"
                        size="min"
                        onClick={() => setShowCalendar((prev) => !prev)}
                    >
                        <Image
                            src={CalendarIcon}
                            alt="Calendar"
                            width={16}
                            height={16}
                            style={{ filter: "brightness(0) invert(1)" }}
                        />
                    </Button>
                </div>
                {showCalendar && (
                    <div
                        className={styles.calendar_wrapper}
                        ref={setFloating}
                        style={{
                            position: strategy,
                            top: y ?? 0,
                            left: x ?? 0,
                            zIndex: 9999,
                        }}
                    >
                        <div className={styles.header}>
                            <div className={styles.title}>
                                <span className={styles.month}>{getMonthName(yearMonth.month)}</span>
                                <span>{yearMonth.year}</span>
                            </div>
                            <div className={styles.pagination}>
                                <Button
                                    element="button"
                                    variant="transparent"
                                    size="sm"
                                    onClick={() => {
                                        const { year, month } = shiftMonth(yearMonth.year, yearMonth.month, -1);
                                        setYearMonth(() => ({ year, month }));
                                    }}
                                >
                                    {"<"}
                                </Button>
                                <Button
                                    element="button"
                                    variant="transparent"
                                    size="sm"
                                    onClick={() => {
                                        const { year, month } = shiftMonth(yearMonth.year, yearMonth.month, 1);
                                        setYearMonth(() => ({ year, month }));
                                    }}
                                >
                                    {">"}
                                </Button>
                            </div>
                        </div>
                        <CalendarGrid
                            className={styles.calendar}
                            selectedDate={date}
                            yearMonth={yearMonth}
                            size="sm"
                            onDateSelect={(date: Date) => {
                                const { year, month } = getYearMonthDay(date);
                                setYearMonth(prev => {
                                    if (prev.year === year && prev.month === month) {
                                        return prev;
                                    }

                                    return {...prev, year, month};
                                });

                                setDate(date);
                                setDateStr(getDateStringFromDate(date, DATE_FORMAT));
                                setShowCalendar(false);
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }
);

export default DateSelector;