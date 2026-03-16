"use client";

import { useCalendarContext } from "@/context";
import AppCalendar from "./AppCalendar";
import styles from "./SidePanel.module.scss";
import { useEffect, useRef, useState } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/ui/Breadcrumb";
import useCalendarStore from "@/store";
import { Task } from "@/models/task";
import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";

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
        <div className={styles.side_panel}>
            <AppCalendar />
            <Breadcrumb>
                <BreadcrumbList>

                    <BreadcrumbItem>
                        <BreadcrumbLink
                            className={styles.backlog}
                            onClick={() => calendarContext.setWorkSessionSelection(null)}
                        >
                            Backlog
                        </BreadcrumbLink>
                    </BreadcrumbItem>

                    {selection && (
                    <>
                        <BreadcrumbSeparator className={styles.separator}/>

                        <BreadcrumbItem style={{ maxWidth: "165px" }}>
                            <BreadcrumbPage
                                className={styles.session}
                            >
                                {selection.workSession.name}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                    )}

                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}