"use client";

import styles from "@/components/MiniCalendar/Cell/Cell.module.scss";

interface CellProps {
    day: number,
    dateString: string,
    isSelected: boolean,
    isToday: boolean,
    isCurrentMonth: boolean,
    onDateSelect: (dateString: string) => void;
}

export default function Cell({ day, dateString, isSelected, isToday, isCurrentMonth, onDateSelect }: CellProps) {
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