"use client";

import AppCalendar from "./AppCalendar";
import styles from "./SidePanel.module.scss";
import { useEffect } from "react";
import useCalendarStore from "@/store";
import { useWorkSessionContext } from "@/workSessionContext";
import { Task } from "@/models/task";
import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import SelectedSession from "@/components/workSessions/SelectedSession";
import Backlog from "./Backlog";


export default function SidePanel() {
    const { isSelected, deselect, isEdit, stopEdit } = useWorkSessionContext();

    const [, updateTasks] = useCalendarStore("tasks");
    const [, updateWorkSessions] = useCalendarStore("work_sessions");
    const [, updateTimeBlocks] = useCalendarStore("time_blocks");

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
            {isSelected ? (
                <div className={styles.selection}>
                    {!isEdit ? (
                        <Button
                            element="button"
                            variant="transparent"
                            size="min"
                            onClick={deselect}
                            className="flex items-center"
                        >
                            <Icon
                                className="mr-2"
                                icon="back_arrow"
                                size="sm"
                            />
                            <span className="h-5 flex items-center">Back</span>
                        </Button>
                    ) : (
                        <Button
                            element="button"
                            variant="transparent"
                            size="min"
                            onClick={stopEdit}
                            className="flex items-center"
                        >
                            <Icon
                                className="mr-2"
                                icon="x"
                                size="sm"
                            />
                            <span className="h-5 flex items-center">Discard changes</span>
                        </Button>
                    )}
                    <SelectedSession />
                </div>
            ) : (
                <Backlog />
            )}
        </div>
    );
}