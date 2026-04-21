"use client";

import { HOUR_HEIGHT } from "@/constants/column";
import styles from "./HourRow.module.scss";
import { HourTime } from "@/utils/Time/HourTime";

interface HourRowProps {
    hour: number;
    refSetter: (el: HTMLDivElement | null) => void;
}

export default function HourRow({ hour, refSetter }: HourRowProps) {
    const hourTime = new HourTime(hour);

    return (
        <div
            ref={refSetter}
            className={styles.hour_row}
            style={{ height: `${HOUR_HEIGHT}px` }}
        >
            <div className={styles.hour_content}>
                <div className={styles.text}>
                    <span>{hourTime.Hour12WithSuffix}</span>
                </div>
                <div className="w-[6px] h-[1px] bg-white" />
            </div>
        </div>
    );
}