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

const DEV_TIME_SCALE = 4; // 1 = real time, 4 = 4x speed

export default function TimerProvider({ children }: { children: React.ReactNode }) {
    const [now, setNow] = useState(() => new Date());
    const listeners = useRef<Set<(unixSeconds: number) => void>>(new Set());

    const onMinuteTick = useCallback((callback: (unixSeconds: number) => void) => {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
    }, []);

    const simulatedNow = useRef<Date>((() => {
        const now = Date.now();
        return new Date(now - (now % 60000));
    })());

    useEffect(() => {
        const msUntilNextMinute = 60000 - (Date.now() % 60000);
        let interval: NodeJS.Timeout;

        const tick = () => {
            simulatedNow.current = new Date(simulatedNow.current.getTime() + 60000);
            setNow(simulatedNow.current);

            // const realTime = new Date().toLocaleTimeString();
            // const simTime = simulatedNow.current.toLocaleTimeString();
            // console.log(`[Timer] real: ${realTime} | simulated: ${simTime}`);

            listeners.current.forEach(cb => cb(Math.floor(simulatedNow.current.getTime() / 1000)));
        };

        const timeout = setTimeout(() => {
            tick();
            interval = setInterval(tick, 60000 / DEV_TIME_SCALE);
        }, msUntilNextMinute);

        return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, []);

    // useEffect(() => {
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