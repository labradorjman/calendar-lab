"use client";

import { useCalendarContext } from "@/context";
import styles from "./SelectedDisplay.module.scss";
import SessionTask from "@/components/workSessions/SessionTask";

export default function SelectedDisplay() {
    const calendarContext = useCalendarContext();
    const selection = calendarContext.workSessionSelection;
    
    if (selection == null) return null;

    const { workSession, tasks } = selection;

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <span className="truncate block w-full">
                {workSession.name}
            </span>
            <div className="flex flex-col gap-2">
                {tasks.map(task => {
                    return (
                        <SessionTask
                            key={task.id}
                            task={task}
                        />
                    );
                })}
            </div>
        </div>
    );
}