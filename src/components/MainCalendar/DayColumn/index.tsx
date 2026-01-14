"use client";

import styles from "@/components/MainCalendar/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { HOUR_HEIGHT, WEEK_DAYS } from "@/constants/calendar";
import { getYearMonthDay } from "@/utils/dateString";
import { useEffect, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { shiftDay } from "@/utils/days";

interface DayColumnProps {
    dateString: string;
    startHour: number;
    endHour: number;
    isRightmost: boolean;
}

export default function DayColumn({ dateString, startHour, endHour, isRightmost}: DayColumnProps) {
    const { year, month, day } = getYearMonthDay(dateString);
    const date = new Date(year, month - 1, day);
    const { year: prevYear, month: prevMonth, day: prevDay } = shiftDay(year, month, day, -1);
    const previousDate = new Date(prevYear, prevMonth - 1, prevDay);

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    const [contentHeight, setContentHeight] = useState<number>(0);
    const [taskContainerHeight, setTaskContainerHeight] = useState<number>(0);

    useEffect(() => {
        if(headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }

        setContentHeight(24 * HOUR_HEIGHT);

        const totalHours = endHour - startHour + 1;
        setTaskContainerHeight(24 * HOUR_HEIGHT);
    }, []);

    const manager = useScrollSyncContext();
    const simpleBarRef = useRef<SimpleBarCore>(null);

    useEffect(() => {
        if (!simpleBarRef.current) return;

        const element = simpleBarRef.current.getScrollElement();
        manager.register(dateString, {
            getScrollElement: () => element
        });

        const handler = () => {
            manager.syncFrom(dateString);
        };

        element?.addEventListener("scroll", handler);

        return () => {
            element?.removeEventListener("scroll", handler);
            manager.unregister(dateString);
        };
    }, [dateString]);

    return (
        <div className={styles.column}>
            <div
                ref={headerRef}
                className={styles.header}
            >
                <div className={styles.day_label}>
                    <span className={styles.name}>{WEEK_DAYS[date.getDay()]}</span>
                    <span className={styles.number}>{day}</span>
                </div>
                {/* {startHour <= -4 && (
                    <div className={styles.day_start}>
                        <span>Starts</span>
                        <span>{WEEK_DAYS[previousDate.getDay()]}</span>
                    </div>
                )} */}
            </div>
            
            <SimpleBar
                ref={simpleBarRef}
                style={{ maxHeight: `calc(100vh - ${headerHeight}px` }}
                className={isRightmost ? undefined : styles.scroll_hidden }
            >
                <div
                    className={styles.content}
                    style={{ height: contentHeight }}
                >
                    <div
                        className={styles.task_container}
                        style={{ height: taskContainerHeight }}
                    >
                        
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}