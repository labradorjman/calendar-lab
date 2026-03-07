"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useCalendarContext } from "./context";
import useCalendarStore from "@/store";
import { postgresTimestamptzToUnix } from "@/utils/time";
import { TimeBlock } from "./models/timeBlock";

interface TimeBlockContextProps {
    hasCollision: (
        startTime: number,
        duration: number,
        taskId?: number,
        workSessionId?: number
    ) => boolean;
    findClosestAvailableStart: (
        startTime: number,
        duration: number,
        taskId?: number,
        workSessionId?: number
    ) => number;
}

interface TimeBlockContextProviderProps {
    children: React.ReactNode;
}

export const TimeBlockContext =
    createContext<TimeBlockContextProps | undefined>(undefined);

export function useTimeBlockContext() {
    const context = useContext(TimeBlockContext);

    if (!context) {
        throw new Error(
            "useTimeBlockContext must be used within TimeBlockContextProvider"
        );
    }

    return context;
}

type Interval = {
    start: number;
    end: number;
};

export default function TimeBlockContextProvider({
    children,
}: TimeBlockContextProviderProps) {
    const calendarContext = useCalendarContext();
    const [timeBlocks] = useCalendarStore("time_blocks");

    const sortedTimeBlocksRef = useRef<TimeBlock[]>([]);

    useEffect(() => {
        sortedTimeBlocksRef.current = timeBlocks
            .filter(tb => tb.startsAt != null)
            .sort(
                (a, b) =>
                    postgresTimestamptzToUnix(a.startsAt!) -
                    postgresTimestamptzToUnix(b.startsAt!)
            );
    }, [timeBlocks, calendarContext.dateRange]);

    function hasCollision(
        start: number,
        duration: number,
        taskId?: number,
        workSessionId?: number
    ) {
        const end = start + duration;

        for (const tb of sortedTimeBlocksRef.current) {
            if ((taskId && tb.taskId === taskId) || (workSessionId && tb.workSessionId === workSessionId)) {
                continue;
            }

            const tbStart = postgresTimestamptzToUnix(tb.startsAt!);
            const tbEnd = tbStart + tb.duration;

            const overlaps = !(end <= tbStart || start >= tbEnd);

            // console.log(`${end} <= ${tbStart} - ${end <= tbStart}\n${start} >= ${tbEnd} - ${start >= tbEnd}`);

            if (overlaps) {
                // console.log('Collision detected with block:', tb);
                return true;
            }
        }

        return false;
    }

    function findClosestAvailableStart(
        start: number,
        duration: number,
        taskId?: number,
        workSessionId?: number
    ) {
        let end = start + duration;

        const blocks = sortedTimeBlocksRef.current;

        for (let i = 0; i < blocks.length; i++) {
            const tb = blocks[i];
            if ((taskId && tb.taskId === taskId) || (workSessionId && tb.workSessionId === workSessionId)) {
                continue;
            }
            
            const tbStart = postgresTimestamptzToUnix(tb.startsAt!);
            const tbEnd = tbStart + tb.duration;

            if (end <= tbStart || start >= tbEnd) {
                continue;
            }

            const candidateStart = tbStart - duration;
            
            const prevBlock = i > 0 ? blocks[i - 1] : null;

            const prevEnd =
                prevBlock &&
                !(
                    (taskId && prevBlock.taskId === taskId) ||
                    (workSessionId && prevBlock.workSessionId === workSessionId)
                )
                    ? postgresTimestamptzToUnix(prevBlock.startsAt!) + prevBlock.duration
                    : -Infinity;
                    
            // console.log(candidateStart, ">=", prevEnd);
            if (candidateStart >= prevEnd) {
                // console.log("return", candidateStart);
                return candidateStart;
            }

            start = tbEnd;
            end = start + duration;
        }

        return start;
    }

    return (
        <TimeBlockContext.Provider value={{
            hasCollision,
            findClosestAvailableStart,
        }}>
            {children}
        </TimeBlockContext.Provider>
    );
}