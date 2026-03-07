"use client";

import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import styles from "./WorkSession.module.scss";
import { Task } from "@/models/task";
import { useCalendarContext } from "@/context";
import { useEffect, useRef } from "react";
import { workSessionToKey } from "@/utils/objectToKey";
import { useTaskContext } from "@/taskContext";

interface WorkSessionProps extends React.HTMLAttributes<HTMLDivElement> {
    workSession: WorkSession;
    timeBlock: TimeBlock;
    tasks: Task[];
}

export default function WorkSessionBlock({ workSession, timeBlock, tasks, style, ...props }: WorkSessionProps) {
    const calendarContext = useCalendarContext();
    const taskContext = useTaskContext();

    const blockRef = useRef<HTMLDivElement>(null);
    const hoveredRef = useRef<boolean>(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!blockRef.current) return;

            if (!blockRef.current.contains(event.target as Node)) {
                calendarContext.setWorkSessionSelection(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [calendarContext]);

    useEffect(() => {
        if (!taskContext.subscribeTaskDrag) return;

        return taskContext.subscribeTaskDrag(state => {
            hoveredRef.current = state.hoverId === workSessionToKey(workSession);

            blockRef.current?.classList.toggle(
                styles.hovered,
                hoveredRef.current
            );
        });
    }, [taskContext]);


    return (
        <div
            ref={blockRef}
            className={styles.session_block}
            data-hover-id={workSessionToKey(workSession)}
            style={{
                ...style,
                "--session-bg": workSession.color,
            } as React.CSSProperties}
            onClick={() => {
                calendarContext.setWorkSessionSelection({
                    workSession,
                    timeBlock,
                    tasks
                });
            }}
        >
            <span>{workSession.name}</span>
        </div>
    );
}