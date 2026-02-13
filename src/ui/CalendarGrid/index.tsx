"use client";

import styles from "./CalendarGrid.module.scss";

import { forwardRef, useEffect, useState } from "react";
import CalendarCell from "@/ui/CalendarCell";
import { useCalendarContext } from "@/context";
import { YearMonthState } from "@/types/yearMonthState";
import { dateToKey } from "@/utils/date";
import { buildMonthDates } from "@/utils/weekBuilder";
import { getNextDates } from "@/utils/days";

interface CalendarGridProps {
    className?: string;
    keyPrefix: string;
    selectedDate?: Date | null;
    yearMonth: YearMonthState;
    size: "sm" | "md" | "lg";
    onDateSelect: (date: Date) => void;
}

const CalendarGrid = forwardRef<HTMLDivElement, CalendarGridProps>(
    ({ className, keyPrefix, selectedDate, yearMonth, size, onDateSelect }, ref) => {
        const calendarContext = useCalendarContext();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const useLocalState = selectedDate !== undefined;

        const [dates, setDates] = useState<Date[]>([]);

        useEffect(() => {
            if (!yearMonth) return;
            setDates(buildMonthDates(yearMonth.year, yearMonth.month));
        }, [yearMonth.year, yearMonth.month]);

        const handleDateSelect = (date: Date) => {
            if (!useLocalState) {
                calendarContext.setSelectedDate(date);
                calendarContext.setDateRange(getNextDates(date, 5));
            }
            onDateSelect(date);
        }

        return (
            <div
                ref={ref}
                className={`${styles.calendar_grid} ${className ?? ""}`}
                data-size={size}
            >
                <div className={styles.weekdays}>
                <div className={styles.name}>M</div>
                <div className={styles.name}>T</div>
                <div className={styles.name}>W</div>
                <div className={styles.name}>T</div>
                <div className={styles.name}>F</div>
                <div className={styles.name}>S</div>
                <div className={styles.name}>S</div>
                </div>

                <div className={styles.grid}>
                    {dates.map((cellDate) => {
                        const isCurrentMonth =
                            cellDate.getMonth() === yearMonth.month - 1 &&
                            cellDate.getFullYear() === yearMonth.year;

                        const isSelected = useLocalState
                            ? selectedDate !== null
                                ? dateToKey(selectedDate!) === dateToKey(cellDate)
                                : false
                            : dateToKey(calendarContext.selectedDate) === dateToKey(cellDate);

                        return (
                            <CalendarCell
                                key={`${keyPrefix}-${dateToKey(cellDate)}`}
                                day={cellDate.getDate()}
                                date={cellDate}
                                isSelected={isSelected}
                                isToday={today.getTime() === cellDate.getTime()}
                                isCurrentMonth={isCurrentMonth}
                                onDateSelect={handleDateSelect}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }
);

CalendarGrid.displayName = "CalendarGrid";

export default CalendarGrid;
