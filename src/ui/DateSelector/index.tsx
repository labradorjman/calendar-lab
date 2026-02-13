"use client";

import styles from "./DateSelector.module.scss";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import CalendarIcon from '@/assets/icons/calendar.webp';
import { DATE_FORMAT, getMonthName, MAX_YEAR, MIN_YEAR } from "@/constants/calendar";
import Button from "../Button";
import MaskedInput from "../MaskedInput";
import { useSmartFloating } from "@/hooks/useSmartFloating";
import CalendarGrid from "../CalendarGrid";
import { YearMonthState } from "@/types/yearMonthState";
import { getDateStringFromDate, getSegmentsForFormat, getYearMonthDay, parseDateFromInput } from "@/utils/date";
import { shiftMonth } from "@/utils/month";

interface DateSelectorProps {
    onDateChange: (date: Date | null) => void;
}

export default function DateSelector({ onDateChange }: DateSelectorProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [date, setDate] = useState<Date | null>(null);
    const [dateStr, setDateStr] = useState<string>("");
    const [yearMonth, setYearMonth] = useState<YearMonthState>({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
    });
    const [showCalendar, setShowCalendar] = useState(false);
    const lastKeyRef = useRef<string | null>(null);

    const startsAtInputRef = useRef<HTMLInputElement>(null);

    const referenceNode = useRef<HTMLElement | null>(null);
    const floatingNode = useRef<HTMLElement | null>(null);

    const { x, y, strategy, reference, floating } = useSmartFloating();

    const setReference = (node: HTMLElement | null) => {
        referenceNode.current = node;
        reference(node); // call the original callback ref
    };

    const setFloating = (node: HTMLElement | null) => {
        floatingNode.current = node;
        floating(node); // call the original callback ref
    };

    useEffect(() => {
        onDateChange(date);
    }, [date]);

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

    function normalizeDateInput(
        value: string,
        lastKey: string | null
    ) {
        // Add slash after DD or MM when typing
        if ((value.length === 2 || value.length === 5)
            && lastKey !== "Backspace"
            && !value.endsWith("/")) {
            return value + "/";
        }

        if ((value.length === 2 || value.length === 5)
            && lastKey === "Backspace"
            && !value.endsWith("/")) {
            return value + "/";
        }

        return value;
    }

   function completeDateInput(value: string) {
        if (!value) return "";

        const parts = value.split("/");

        let dayStr = parts[0] ?? "";
        let monthStr = parts[1] ?? "";
        let yearStr = parts[2] ?? "";

        const today = new Date();

        const day = Number(dayStr);
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

        if (isNaN(day)) return "";

        const maxDays = new Date(year, month, 0).getDate();
        const validDay = Math.max(1, Math.min(day, maxDays));
        
        const segments = getSegmentsForFormat(DATE_FORMAT);
        const finalDate = segments.map(seg => {
            switch (seg.name) {
                case "day":
                    return validDay.toString().padStart(seg.end - seg.start, "0");
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
        const slashPositions = [3, 6];
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
            console.error("Cannot find segment for position:", pos);
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
                startsAtInputRef.current?.blur();
                return;
            }

            e.preventDefault();

            tabValue = chars.slice(start, end).join("");
            if (name !== "year") {
                tabValue = tabValue === "0" ? "01" : tabValue.padStart(2, "0");
            }
        }

        const startValue = start > 0 ? chars.slice(0, start).join("") : "";
        const normalized = normalizeDateInput(`${startValue}${tabValue}`, lastKeyRef.current);
        setDateStr(normalized);
    }

    return (
        <div
            ref={setReference}
            className={styles.date_selector}
        >
            <MaskedInput
                ref={startsAtInputRef}
                mask={DATE_FORMAT === "yyyy/MM/dd" ? "dddd/dd/dd" : "dd/dd/dddd"}
                placeholder={DATE_FORMAT.toLowerCase()}
                value={dateStr}
                onBlur={(_) => {
                    const completeStr = completeDateInput(dateStr);
                    setDateStr(completeStr);

                    const parsed = parseDateFromInput(completeStr, DATE_FORMAT);
                    setDate(parsed);
                }}
                onKeyDown={(e) => {
                    lastKeyRef.current = e.key;

                    if (e.key === "Backspace") {
                        handleBackspace(e);
                    } else if (e.key === "Tab") {
                        handleTab(e);
                    }
                }}
                onChange={(value) => {
                    const normalized = normalizeDateInput(value, lastKeyRef.current);
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
                        width={18}
                        height={18}
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
                        keyPrefix="st_select"
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
