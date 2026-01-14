"use client";

import styles from "@/components/MainCalendar/DayColumn/TimeColumn/TimeColumn.module.scss";
import HourRow from "@/components/MainCalendar/DayColumn/HourRow";
import SimpleBar from "simplebar-react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import type SimpleBarCore from "simplebar-core";
import { useEffect, useRef } from "react";

interface TimeColumnProps {
    isHidden: boolean;
    startHour: number;
    endHour: number;
}

const TIME_COLUMN_NAME = "time_column";

export default function TimeColumn({ isHidden, startHour, endHour }: TimeColumnProps) {
    const timeColumnClass = [
        styles.time_column,
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
        <div className={timeColumnClass}>
            <SimpleBar
                ref={simpleBarRef}
                style={{ height: "100%" }}
                autoHide={false}
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
        </div>
    );
}