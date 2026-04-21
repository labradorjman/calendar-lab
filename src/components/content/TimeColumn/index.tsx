"use client";

import { HOUR_HEIGHT } from "@/constants/column";
import styles from "./TimeColumn.module.scss";
import HourRow from "@/components/content/HourRow";
import { useTimer } from "@/timerContext";
import { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";

interface TimeColumnProps {
    startHour: number;
    endHour: number;
}

export default function TimeColumn({ startHour, endHour }: TimeColumnProps) {
    const isPrevDayStart = startHour < 0;
    const length = endHour - startHour + 1;

    const { onMinuteTick } = useTimer();

    const hourRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const currentTimeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return onMinuteTick((_, hour24, minute) => {
            const time12 =
                `${hour24 % 12 || 12}:${minute.toString().padStart(2, "0")}`;

            if (currentTimeRef.current) {
                currentTimeRef.current.textContent = time12;

                const top = hour24 * HOUR_HEIGHT + minute * (HOUR_HEIGHT / 60);
                currentTimeRef.current.style.top = `${top}px`;
            }

            // Hide 
            hourRowRefs.current.forEach((el, hour) => {
                const shouldHide = 
                    (hour === hour24 && minute < 10) ||
                    (hour === hour24 + 1 && minute > 50);
                el.style.visibility = shouldHide ? "hidden" : "visible";
            });
        });
    }, [onMinuteTick]);

    return (
        <SimpleBar style={{ maxHeight: "100%" }}>
            <div className={styles.time_area}>
                <div
                    ref={currentTimeRef}
                    className={styles.current_time}
                >
                    12:00
                </div>
                {Array.from({ length }).map((_, index) => {
                    const hour =
                        isPrevDayStart && index < Math.abs(startHour)
                            ? 24 + startHour + index
                            : startHour + index;

                    return (
                        <HourRow
                            key={hour}
                            hour={hour}
                            refSetter={(el) => {
                                if (el) hourRowRefs.current.set(hour, el);
                                else hourRowRefs.current.delete(hour);
                            }}
                        />
                    );
                })}
            </div>
        </SimpleBar>
    );
}