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
const FIXED_START = new Date(2026, 3, 22, 5, 0, 0);
const DEV_TIME_SCALE = 50;

export default function TimerProvider({ children }: { children: React.ReactNode }) {
    // Single state just to trigger re-renders
    const [, setTick] = useState(0);

    const nowRef = useRef<Date>(IS_DEV ? FIXED_START : new Date());
    const hour24Ref = useRef<number>(nowRef.current.getHours());
    const minuteRef = useRef<number>(nowRef.current.getMinutes());

    const listeners = useRef<Set<(unixSeconds: number, hour24: number, minute: number) => void>>(new Set());
    const mountedAt = useRef<number>(Date.now());
    const lastMinute = useRef<number>(-1);

    const onMinuteTick = useCallback((callback: (unixSeconds: number, hour24: number, minute: number) => void) => {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
    }, []);

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

                // Mutate refs, then trigger one re-render
                nowRef.current = floored;
                hour24Ref.current = h;
                minuteRef.current = m;
                setTick(t => t + 1);

                listeners.current.forEach(cb => cb(Math.floor(floored.getTime() / 1000), h, m));
            }
        };

        tick();
        const interval = setInterval(tick, 60000 / DEV_TIME_SCALE);
        return () => clearInterval(interval);
    }, []);

    return (
        <TimerContext.Provider value={{
            now: nowRef.current,
            hour24: hour24Ref.current,
            minute: minuteRef.current,
            onMinuteTick,
        }}>
            {children}
        </TimerContext.Provider>
    );
}