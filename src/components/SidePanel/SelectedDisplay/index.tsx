"use client";

import { useCalendarContext } from "@/context";
import styles from "./SelectedDisplay.module.scss";

export default function SelectedDisplay() {
    const calendarContext = useCalendarContext();
    const selection = calendarContext.workSessionSelection;
    
    if (selection == null) return null;

    const { workSession, tasks } = selection;

    return (
        <div className="w-full h-full">
            <span className="truncate block w-full">
                {workSession.name}
            </span>
        </div>
    );
}