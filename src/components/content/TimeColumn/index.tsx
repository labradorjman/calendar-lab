"use client";

import styles from "./TimeColumn.module.scss";
import HourRow from "@/components/content/HourRow";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import type SimpleBarCore from "simplebar-core";
import { useEffect, useRef, useState } from "react";
import SimpleBar from "simplebar-react";
import { useTaskContext } from "@/taskContext";

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
    const scrollSyncContext = useScrollSyncContext();
    const simpleBarRef = useRef<SimpleBarCore>(null);

    useEffect(() => {
        if (!simpleBarRef.current) return;

        const element = simpleBarRef.current.getScrollElement();

        scrollSyncContext.register(TIME_COLUMN_NAME, {
            getScrollElement: () => element
        });

        const handler = () => {
            scrollSyncContext.syncFrom(TIME_COLUMN_NAME);
        };

        element?.addEventListener("scroll", handler);

        return () => {
            element?.removeEventListener("scroll", handler);
            scrollSyncContext.unregister(TIME_COLUMN_NAME);
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