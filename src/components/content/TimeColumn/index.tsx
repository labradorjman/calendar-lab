"use client";

import styles from "./TimeColumn.module.scss";
import HourRow from "@/components/content/HourRow";
import type SimpleBarCore from "simplebar-core";
import { useRef } from "react";
import SimpleBar from "simplebar-react";

interface TimeColumnProps {
    isHidden: boolean;
    startHour: number;
    endHour: number;
}

interface Alignment {
    left: number;
    top: number;
    width: number;
}

export default function TimeColumn({ isHidden, startHour, endHour }: TimeColumnProps) {
    const timeColumnClass = [
        styles.column,
        isHidden ? styles.time_hidden : undefined,
    ].filter(Boolean).join(" ");

    const isPrevDayStart = startHour < 0;
    const length = endHour - startHour + 1;

    return (
        <SimpleBar
            className={timeColumnClass}
            style={{ maxHeight: "100%" }}
        >
            <div className={styles.time_area}>
                {Array.from({ length }).map((_, index) => {
                    const hour =
                        isPrevDayStart && index < Math.abs(startHour)
                            ? 24 + startHour + index
                            : startHour + index;

                    return (
                        <HourRow
                            key={hour}
                            hour={hour}
                        />
                    );
                })}
            </div>
        </SimpleBar>
    );
}