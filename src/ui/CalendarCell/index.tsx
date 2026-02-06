"use client";

import styles from "./CalendarCell.module.scss";

interface CellProps {
    day: number,
    dateString: string,
    isSelected: boolean,
    isToday: boolean,
    isCurrentMonth: boolean,
    onDateSelect: (date: string) => void;
}

export default function CalendarCell({ day, dateString, isSelected, isToday, isCurrentMonth, onDateSelect }: CellProps) {
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
            onClick={() => onDateSelect(dateString)}
        >
            <span>{day}</span>
        </div>
    );
}