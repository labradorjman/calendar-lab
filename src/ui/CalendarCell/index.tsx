"use client";

import styles from "./CalendarCell.module.scss";

interface CellProps {
    day: number,
    date: Date,         // yyyy-MM-dd
    isSelected: boolean,
    isToday: boolean,
    isCurrentMonth: boolean,
    onDateSelect: (date: Date) => void;
}

export default function CalendarCell({ day, date, isSelected, isToday, isCurrentMonth, onDateSelect }: CellProps) {
        const className = [
            styles.cell,
            isSelected && styles.selected,
            isToday && styles.today,
            !isCurrentMonth && styles.other_month
        ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className={className}
            onClick={() => onDateSelect(date)}
        >
            <span>{day}</span>
        </div>
    );
}