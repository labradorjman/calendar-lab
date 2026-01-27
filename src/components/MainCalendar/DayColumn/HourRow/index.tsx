"use client";

import styles from "@/components/MainCalendar/DayColumn/HourRow/HourRow.module.scss";
import { HourTime } from "@/utils/Time/HourTime";

interface HourRowProps {
    hour: number
}

export default function HourRow({ hour }: HourRowProps) {
    const hourTime = new HourTime(hour);

    return (
        <div className={styles.hour_row}>
            <div className={styles.row} />
            <div className={styles.text}>
                <span>{hourTime.Hour12WithSuffix}</span>
            </div>
        </div>
    );
}