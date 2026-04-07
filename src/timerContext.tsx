"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type TimerContextProps = {
    now: Date;
    onMinuteTick: (callback: (unixSeconds: number) => void) => () => void;
};
const TimerContext = createContext<TimerContextProps | null>(null);

export function useTimer() {
    const ctx = useContext(TimerContext);
    if (!ctx) throw new Error("useTimer must be used within TimerProvider");

    return ctx;
}

const IS_DEV = process.env.NODE_ENV === "development";
const FIXED_START = new Date(2025, 3, 7, 2, 0, 0);
const DEV_TIME_SCALE = 10; // 1 = real time, 10 = 10x speed

export default function TimerProvider({ children }: { children: React.ReactNode }) {
    const [now, setNow] = useState(() => IS_DEV ? FIXED_START : new Date());
    const listeners = useRef<Set<(unixSeconds: number) => void>>(new Set());

    const onMinuteTick = useCallback((callback: (unixSeconds: number) => void) => {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
    }, []);

    // Dev: time-scaled simulation
    const mountedAt = useRef<number>(Date.now());
    const lastMinute = useRef<number>(-1);

    useEffect(() => {
        if (!IS_DEV) return;

        const getSimulatedNow = () => {
            const realElapsed = Date.now() - mountedAt.current;
            const simElapsed = realElapsed * DEV_TIME_SCALE;
            return new Date(FIXED_START.getTime() + simElapsed);
        };

        const tick = () => {
            const simNow = getSimulatedNow();
            const simMinute = Math.floor(simNow.getTime() / 60000);

            if (simMinute !== lastMinute.current) {
                lastMinute.current = simMinute;
                const floored = new Date(simMinute * 60000);
                setNow(floored);
                listeners.current.forEach(cb => cb(Math.floor(floored.getTime() / 1000)));
            }
        };

        tick();
        const interval = setInterval(tick, 60000 / DEV_TIME_SCALE);
        return () => clearInterval(interval);
    }, []);

    // Production: real-time
    // useEffect(() => {
    //     if (IS_DEV) return;

    //     const msUntilNextMinute = 60000 - (Date.now() % 60000);
    //     let interval: NodeJS.Timeout;

    //     const tick = () => {
    //         const now = new Date();
    //         setNow(now);
    //         listeners.current.forEach(cb => cb(Math.floor(now.getTime() / 1000)));
    //     };

    //     const timeout = setTimeout(() => {
    //         tick();
    //         interval = setInterval(tick, 60000);
    //     }, msUntilNextMinute);

    //     return () => {
    //         clearTimeout(timeout);
    //         if (interval) clearInterval(interval);
    //     };
    // }, []);

    return (
        <TimerContext.Provider value={{ now, onMinuteTick }}>
            {children}
        </TimerContext.Provider>
    );
}