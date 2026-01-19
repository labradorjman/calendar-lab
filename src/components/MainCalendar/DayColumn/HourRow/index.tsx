"use client";

import styles from "@/components/MainCalendar/DayColumn/HourRow/HourRow.module.scss";
import { getHourString } from "@/utils/time";

interface HourRowProps {
    hour: number
}

export default function HourRow({ hour }: HourRowProps) {
    return (
        <div className={styles.hour_row}>
            <div className={styles.row} />
            <div className={styles.text}>
                <span>{getHourString(hour, true)}</span>
            </div>
        </div>
    );
}