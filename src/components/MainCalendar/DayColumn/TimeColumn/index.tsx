"use client";

import styles from "@/components/MainCalendar/DayColumn/TimeColumn/TimeColumn.module.scss";
import HourRow from "@/components/MainCalendar/DayColumn/HourRow";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import type SimpleBarCore from "simplebar-core";
import { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";

interface TimeColumnProps {
    isHidden: boolean;
    startHour: number;
    endHour: number;
}

const TIME_COLUMN_NAME = "time_column";

export default function TimeColumn({ isHidden, startHour, endHour }: TimeColumnProps) {
    const timeColumnClass = [
        styles.column,
        isHidden ? styles.time_hidden : undefined,
    ].filter(Boolean).join(" ");

    const isPrevDayStart = startHour < 0;
    const length = endHour - startHour + 1;

    const manager = useScrollSyncContext();
    const simpleBarRef = useRef<SimpleBarCore>(null);

    useEffect(() => {
        if (!simpleBarRef.current) return;

        const element = simpleBarRef.current.getScrollElement();
        manager.register(TIME_COLUMN_NAME, {
            getScrollElement: () => element
        });

        const handler = () => {
            manager.syncFrom(TIME_COLUMN_NAME);
        };

        element?.addEventListener("scroll", handler);

        return () => {
            element?.removeEventListener("scroll", handler);
            manager.unregister(TIME_COLUMN_NAME);
        };
    }, []);

    return (
        <SimpleBar
            ref={simpleBarRef}
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