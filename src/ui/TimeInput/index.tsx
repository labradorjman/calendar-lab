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
    defaultValue?: { time12: string, meridiem: Meridiem };
    onTimeChange: (hourTime: HourTime | null) => void;
}

const TimeInput = forwardRef<ClearableHandle, TimeInputProps>(
    ({ defaultValue, onTimeChange }, ref) => {
        const [time, setTime] = useState<string>("");
        const [timeStr, setTimeStr] = useState<string>("");
        const [meridiem, setMeridiem] = useState<Meridiem>("AM");

        const inputRef = useRef<HTMLInputElement>(null);

        function handleClear() {
            setTimeStr("");
            setTime("");
            setMeridiem("AM");
        }

        useImperativeHandle(ref, () => ({
            clear: handleClear
        }));

        useEffect(() => {
            // Time and timeStr not synced up (user is still inputting)
            if(time !== timeStr) return;
            
            if(!time) {
                onTimeChange(null);
                return;
            }

            handleValidTimeChange(time);
        }, [time, meridiem]);

        useEffect(() => {
            if (!defaultValue) return;

            setTimeStr(defaultValue.time12);
            setTime(defaultValue.time12);
            setMeridiem(defaultValue.meridiem);
        }, [defaultValue]);

        function handleValidTimeChange(validTimeStr: string) {
            const [hourStr, minuteStr] = validTimeStr.split(":");
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);
            onTimeChange(HourTime.from12Hour(hour, minute, meridiem));
        }

        function normalizeTimeInput(value: string) {
            const isColonPosition = value.length === 2;
            if (isColonPosition && !value.endsWith(":")) {
                return value + ":";
            }

            return value;
        }

        function setCompleteTime(e: React.FocusEvent<HTMLInputElement>) {
            const value = e.target.value;
            if (!value) return "";

            // Only complete (fill in) and validate string if the user enters a full value for the last segment
            if (value.length < 4) return value;

            const parts = value.split(":");

            let hourStr = parts[0] ?? "";
            let minuteStr = parts[1] ?? "";

            const rawHour = Number(hourStr);
            const rawMinute = Number(minuteStr);

            const hour =
                Number.isInteger(rawHour) && rawHour >= 1 && rawHour <= 12
                    ? rawHour
                    : 12;

            const minute =
                Number.isInteger(rawMinute) && rawMinute >= 0 && rawMinute <= 59
                    ? rawMinute
                    : 0;

            const finalTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

            setTimeStr(finalTime);
            setTime(finalTime.length === 5 ? finalTime : "");
        }

        function handleBackspace(e: React.KeyboardEvent<HTMLInputElement>) {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? pos;

            if (pos !== end) {
                return;
            }

            const isColonAtBoundary = pos === 3;

            if (isColonAtBoundary) {
                e.preventDefault();
                setTimeStr(prev => {
                    if(timeStr.endsWith(":")) {
                        return timeStr.slice(0, -1); 
                    }
                    return prev;
                });

                return;
            }
        }

        function handleTab(e: React.KeyboardEvent<HTMLInputElement>) {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;

            const chars = timeStr.split("");

            let segment = SEGMENTS.find(s => pos > s.start && pos <= s.end)
                || SEGMENTS.find(s => pos + 1 > s.start && pos + 1 <= s.end);

            if (!segment) {
                console.error("Cannot find time segment for position:", pos);
                return;
            }

            const { name, start, end } = segment;
            const today = new Date();

            let tabValue = "";

            const isEmpty = start === chars.length;
            if (isEmpty) {
                switch (name) {
                    case "hour":
                        const hour12 = today.getHours() % 12 || 12;
                        tabValue = hour12.toString().padStart(2, "0");
                        break;
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
            const normalized = normalizeTimeInput(`${startValue}${tabValue}`);
            setTimeStr(normalized);
        }

        return (
            <div className={styles.wrapper}>
                <MaskedInput
                    ref={inputRef}
                    className={styles.input}
                    mask={"dd:dd"}
                    placeholder={"hh:mm"}
                    value={timeStr}
                    onBlur={(e) => {
                        setCompleteTime(e);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                            handleBackspace(e);
                        } else if (e.key === "Tab") {
                            handleTab(e);
                        }
                    }}
                    onChange={(value) => {
                        const normalized = normalizeTimeInput(value);
                    setTimeStr(normalized);
                    }}
                />
                <div className={styles.meridiem_area}>
                    <span
                        className={styles.select}
                        onClick={() => setMeridiem((prev) => 
                            prev === "AM" ? "PM" : "AM"
                        )}
                    >
                        {meridiem}
                    </span>
                </div>
            </div>
        );
    }
);

export default TimeInput;