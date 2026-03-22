"use client";

import { useCalendarContext } from "@/context";
import AppCalendar from "./AppCalendar";
import styles from "./SidePanel.module.scss";
import { useEffect } from "react";
import useCalendarStore from "@/store";
import { Task } from "@/models/task";
import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import SelectedSession from "@/components/workSessions/SelectedSession";
import Backlog from "./Backlog";

export default function SidePanel() {
    const calendarContext = useCalendarContext();
    const selection = calendarContext.workSessionSelection;

    const [_, updateTasks] = useCalendarStore("tasks");
    const [__, updateWorkSessions] = useCalendarStore("work_sessions");
    const [___, updateTimeBlocks] = useCalendarStore("time_blocks");

    useEffect(() => {
        async function fetchTasks() {
            const res = await fetch("/api/tasks");
            const data: Task[] = await res.json();
            
            updateTasks(() => data);
        }

        async function fetchWorkSessions() {
            const res = await fetch("/api/work-sessions");
            const data: WorkSession[] = await res.json();

            updateWorkSessions(() => data);
        }

        async function fetchTimeBlocks() {
            const res = await fetch("/api/time-blocks");
            const data: TimeBlock[] = await res.json();

            updateTimeBlocks(() => data);
        }

        fetchTasks();
        fetchWorkSessions();
        fetchTimeBlocks();
    }, []);
    
    return (
        <div className={styles.side_panel} data-target="side_panel">
            <AppCalendar />
            <div className={styles.divider} />
            {selection != null ? (
                <div className={styles.selection}>
                    <Button
                        element="button"
                        variant="transparent"
                        size="min"
                        onClick={() => calendarContext.setWorkSessionSelection(null)}
                        className="flex items-center"
                    >
                        <Icon 
                            className="mr-2"
                            icon="back_arrow"
                            size="sm"
                        />
                        <span className="h-5 flex items-center">Back</span>
                    </Button>
                    <SelectedSession />
                </div>
            ) : (
                <Backlog />
            )}
        </div>
    );
}