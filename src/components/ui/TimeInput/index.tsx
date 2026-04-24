"use client";

import styles from "./TimeInput.module.scss";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import MaskedInput from "../MaskedInput";
import { Meridiem } from "@/types/meridiem";
import { HourTime } from "@/utils/Time/HourTime";
import { ClearableHandle } from "@/types/componentHandles";

const SEGMENTS = [
    { name: "hour", start: 0, end: 2 },
    { name: "minute", start: 3, end: 5 },
];

interface TimeInputProps {
    initialValue?: { time12: string; meridiem: Meridiem };
    onTimeChange: (hourTime: HourTime | null) => void;
}

const TimeInput = forwardRef<ClearableHandle, TimeInputProps>(
    ({ initialValue, onTimeChange }, ref) => {
        const [displayValue, setDisplayValue] = useState(initialValue?.time12 ?? "");
        const [meridiem, setMeridiem] = useState<Meridiem>(initialValue?.meridiem ?? "AM");

        const inputRef = useRef<HTMLInputElement>(null);

        useImperativeHandle(ref, () => ({
            clear: () => {
                setDisplayValue("");
                setMeridiem("AM");
                onTimeChange(null);
            }
        }));

        const commitTime = (raw: string, currentMeridiem: Meridiem) => {
            if (!raw || raw.length < 4) {
                onTimeChange(null);
                return;
            }

            const parts = raw.split(":");
            const rawHour = Number(parts[0]);
            const rawMinute = Number(parts[1]);

            // Clamp to valid 12-hour range
            const hour =
                Number.isInteger(rawHour) && rawHour >= 1 && rawHour <= 12
                    ? rawHour
                    : 12;
            const minute =
                Number.isInteger(rawMinute) && rawMinute >= 0 && rawMinute <= 59
                    ? rawMinute
                    : 0;

            const finalDisplay = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            setDisplayValue(finalDisplay);
            onTimeChange(HourTime.from12Hour(hour, minute, currentMeridiem));
        };

        const pendingMeridiemCommit = useRef(false);

        const handleMeridiemToggle = () => {
            // Flag that the next meridiem state change should trigger a commit
            pendingMeridiemCommit.current = true;
            setMeridiem(prev => (prev === "AM" ? "PM" : "AM"));
        };

        useEffect(() => {
            // Only runs after a meridiem toggle, not on initial mount
            if (!pendingMeridiemCommit.current) return;
            
            pendingMeridiemCommit.current = false;
            commitTime(displayValue, meridiem);
        }, [meridiem]);

        const normalizeTimeInput = (value: string) => {
            // Auto-insert colon after the hour digits (e.g. "09" → "09:")
            if (value.length === 2 && !value.endsWith(":")) {
                return value + ":";
            }
            return value;
        };

        const handleBackspace = (e: React.KeyboardEvent<HTMLInputElement>) => {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? pos;

            // If there's a selection let the browser handle it normally
            if (pos !== end) return;

            // At position 3 the cursor is right after the colon — backspace should
            // remove the colon, not the digit before it
            if (pos === 3) {
                e.preventDefault();
                setDisplayValue(prev => (prev.endsWith(":") ? prev.slice(0, -1) : prev));
            }
        };

        const handleTab = (e: React.KeyboardEvent<HTMLInputElement>) => {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;
            const chars = displayValue.split("");

            // Find which segment (hour / minute) the cursor is in
            const segment =
                SEGMENTS.find(s => pos > s.start && pos <= s.end) ||
                SEGMENTS.find(s => pos + 1 > s.start && pos + 1 <= s.end);

            if (!segment) {
                console.error("Cannot find time segment for position:", pos);
                return;
            }

            const { name, start, end } = segment;
            const today = new Date();
            let tabValue = "";

            const isEmpty = start === chars.length;

            if (isEmpty) {
                // Segment not started yet — fill with current time value
                switch (name) {
                    case "hour": {
                        const hour12 = today.getHours() % 12 || 12;
                        tabValue = hour12.toString().padStart(2, "0");
                        break;
                    }
                    case "minute":
                        tabValue = today.getMinutes().toString().padStart(2, "0");
                        break;
                }
                e.preventDefault();
            } else {
                if (segment.end === 5) {
                    inputRef.current?.blur();
                    return;
                }

                e.preventDefault();

                tabValue = chars.slice(start, end).join("");
                tabValue = tabValue === "0" ? "01" : tabValue.padStart(2, "0");
            }

            const startValue = start > 0 ? chars.slice(0, start).join("") : "";
            setDisplayValue(normalizeTimeInput(`${startValue}${tabValue}`));
        };

        return (
            <div className={styles.wrapper}>
                <MaskedInput
                    ref={inputRef}
                    className={styles.input}
                    mask={"dd:dd"}
                    placeholder={"hh:mm"}
                    value={displayValue}
                    onBlur={() => commitTime(displayValue, meridiem)}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace") handleBackspace(e);
                        else if (e.key === "Tab") handleTab(e);
                    }}
                    onChange={(value) => setDisplayValue(normalizeTimeInput(value))}
                />
                <div className={styles.meridiem_area}>
                    <span className={styles.select} onClick={handleMeridiemToggle}>
                        {meridiem}
                    </span>
                </div>
            </div>
        );
    }
);

TimeInput.displayName = "TimeInput";
export default TimeInput;