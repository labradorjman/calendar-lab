"use client";

import styles from "@/components/MainCalendar/DayColumn/TimeColumn/TimeColumn.module.scss";
import HourRow from "@/components/MainCalendar/DayColumn/HourRow";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import type SimpleBarCore from "simplebar-core";
import { useEffect, useRef, useState } from "react";
import SimpleBar from "simplebar-react";
import { useTaskContext } from "@/taskContext";
import { isValidYMD } from "@/utils/dateString";
import { HEADER_HEIGHT, SNAP_MINS } from "@/constants/calendar";
import { getHourMinuteString } from "@/utils/time";

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

const TIME_COLUMN_NAME = "time_column";

export default function TimeColumn({ isHidden, startHour, endHour }: TimeColumnProps) {
    const timeColumnClass = [
        styles.column,
        isHidden ? styles.time_hidden : undefined,
    ].filter(Boolean).join(" ");

    const isPrevDayStart = startHour < 0;
    const length = endHour - startHour + 1;

    const rightPosRef = useRef<number>(0);
    const columnWidthRef = useRef<number>(0);
    const [showAlignment, setShowAlignment] = useState<boolean>(false);
    const [alignment, setAlignment] = useState<Alignment>({
        left: 0,
        top: 0,
        width: 0,
    });

    const [timeString, setTimeString] = useState<string>("12:00");

    const taskContext = useTaskContext();
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

    useEffect(() => {
        const rect = simpleBarRef.current?.getContentElement()?.getBoundingClientRect();

        columnWidthRef.current = simpleBarRef.current?.contentEl?.clientWidth ?? 0;
        const left = (rect?.left ?? 0) + columnWidthRef.current;

        setAlignment(prev => ({
            ...prev,
            left
        }));
    }, [simpleBarRef.current]);
  
    useEffect(() => {
        if (!taskContext.subscribeHoveredColumn) return;

        const unsubscribe = taskContext.subscribeHoveredColumn(state => {
            const isDayColumn = isValidYMD(state.columnId ?? "");
            setShowAlignment(isDayColumn);

            if (!isDayColumn) return;

            const right = state.columnRight ?? 0;
            if (right === 0) return;

            const topOffset = state.topOffset ?? 0;
            const scrollTop = simpleBarRef.current?.getScrollElement()?.scrollTop ?? 0;
            // console.log("SCROLL TOP:", scrollTop);

            const hourMinuteString = getHourMinuteString(state.columnContentTop ?? 0, SNAP_MINS);

            setTimeString(prev => {
                if(hourMinuteString === prev) {
                    return prev;
                }

                return hourMinuteString;
            })

            // console.log("T:", topOffset, "S:", scrollTop, "H:", HEADER_HEIGHT);
            setAlignment(prev => {
                const nextTop = Math.max(HEADER_HEIGHT, topOffset);
                const nextWidth = right - prev.left;

                const hasChanged =
                nextTop !== prev.top ||
                nextWidth !== prev.width ||
                right !== rightPosRef.current;

                if (!hasChanged) return prev;

                rightPosRef.current = right;

                return {
                    ...prev,
                    top: nextTop,
                    width: nextWidth,
                };
            });
        });

        return () => unsubscribe();
    }, [taskContext]);

    return (
        <>
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
            {showAlignment && (
                <>
                    <span
                        className={styles.time}
                        style={{
                            left: `${alignment.left - columnWidthRef.current}px`,
                            top: `${alignment.top}px`,
                            width: `${columnWidthRef.current}px`,
                        }}
                    >
                        {timeString}
                    </span>
                    <div
                        className={styles.line}
                        style={{
                            left: `${alignment.left}px`,
                            top: `${alignment.top}px`,
                            width: `${alignment.width}px`,
                        }}
                    />
                </>
            )}

        </>
    );
}