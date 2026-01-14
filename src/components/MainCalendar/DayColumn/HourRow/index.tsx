"use client";

import styles from "@/components/MainCalendar/DayColumn/HourRow/HourRow.module.scss";

interface HourRowProps {
    hour: number
}

export default function HourRow({ hour }: HourRowProps) {
    const quotient = Math.floor(hour / 12);
    const remainder = hour % 12;
    const suffix = quotient % 2 === 0 ? "AM" : "PM";

    return (
        <div className={styles.hour_row}>
            <div className={styles.row} />
            <div className={styles.text}>
                <span>{`${remainder === 0 ? 12 : remainder} ${suffix}`}</span>
            </div>
        </div>
    );
}