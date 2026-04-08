"use client";

import styles from "./DayHeader.module.scss";
import { WEEK_DAYS } from "@/constants/calendar";

interface DayHeaderProps {
    date: Date;
}

export default function DayHeader({ date }: DayHeaderProps) {
    return (
        <div className={styles.header}>
            <div className={styles.day_label}>
                <span className={styles.name}>{WEEK_DAYS[date.getDay()]}</span>
                <span className={styles.number}>{date.getDate()}</span>
            </div>
        </div>
    );
}