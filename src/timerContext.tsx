"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type TimerContextProps = {
    now: Date;
    hour24: number;
    minute: number;
    onMinuteTick: (callback: (unixSeconds: number, hour24: number, minute: number) => void) => () => void;
};
const TimerContext = createContext<TimerContextProps | null>(null);

export function useTimer() {
    const ctx = useContext(TimerContext);
    if (!ctx) throw new Error("useTimer must be used within TimerProvider");

    return ctx;
}

const IS_DEV = process.env.NODE_ENV === "development";
const FIXED_START = new Date(2026, 3, 22, 2, 45, 0);
const DEV_TIME_SCALE = 10; // 1 = real time, 10 = 10x speed

export default function TimerProvider({ children }: { children: React.ReactNode }) {
    const [now, setNow] = useState(() => IS_DEV ? FIXED_START : new Date());
    const [hour24, setHour24] = useState(() => (IS_DEV ? FIXED_START : new Date()).getHours());
    const [minute, setMinute] = useState(() => (IS_DEV ? FIXED_START : new Date()).getMinutes());
    const listeners = useRef<Set<(unixSeconds: number, hour24: number, minute: number) => void>>(new Set());

    const onMinuteTick = useCallback((callback: (unixSeconds: number, hour24: number, minute: number) => void) => {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
    }, []);

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
                const h = floored.getHours();
                const m = floored.getMinutes();
                setNow(floored);
                setHour24(h);
                setMinute(m);
                listeners.current.forEach(cb => cb(Math.floor(floored.getTime() / 1000), h, m));
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
    //         const h = now.getHours();
    //         const m = now.getMinutes();
    //         setNow(now);
    //         setHour(h);
    //         setMinute(m);
    //         listeners.current.forEach(cb => cb(Math.floor(now.getTime() / 1000), h, m));
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
        <TimerContext.Provider value={{ now, hour24, minute, onMinuteTick }}>
            {children}
        </TimerContext.Provider>
    );
}