"use client";

import styles from "@/components/content/Content.module.scss";

import { useCalendarContext } from "@/context";
import DayColumn from "./DayColumn";
import { useEffect, useRef } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import TimeColumn from "./TimeColumn";
import TaskModal from "@/components/tasks/TaskModal";
import useCalendarStore from "@/store";
import { Task } from "@/models/task";
import { dateToKey } from "@/utils/date";
import WorkSessionModal from "../workSessions/WorkSessionModal";
import { WorkSession } from "@/models/workSession";

const TIME_COLUMN_NAME = "time_column";

export default function Content() {
    const calendarContext = useCalendarContext();
    const scrollSyncContext = useScrollSyncContext();

    const [_, updateTasks] = useCalendarStore("tasks");
    const [__, updateWorkSessions] = useCalendarStore("work_sessions");
    const [___, updateTimeBlocks] = useCalendarStore("time_blocks");

    const isInitialMount = useRef<boolean>(true);
    const prevDateRange = useRef<Date[]>([]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevDateRange.current = calendarContext.dateRange;
            return;
        }

        const unregisterDays = prevDateRange.current.filter(
        prev =>
            !calendarContext.dateRange.some(
            curr => dateToKey(curr) === dateToKey(prev)
            )
        );
        
        unregisterDays.forEach(date => scrollSyncContext.unregister(dateToKey(date)));
        
        prevDateRange.current = calendarContext.dateRange;
    }, [calendarContext.dateRange]);

    useEffect(() => {
        scrollSyncContext.clearRelations(TIME_COLUMN_NAME);
        calendarContext.dateRange.forEach(date => {
            scrollSyncContext.removeRelation(dateToKey(date), TIME_COLUMN_NAME);

            const relatedKeys = calendarContext.dateRange
                .filter(val => val.getTime() !== date.getTime())
                .map(dateToKey);
            relatedKeys.push(TIME_COLUMN_NAME);
            scrollSyncContext.relate(dateToKey(date), relatedKeys);

            scrollSyncContext.relate(TIME_COLUMN_NAME, [dateToKey(date)]);
        });
    }, [calendarContext.dateRange]);
    
    return (
        <>
            <div className={styles.content}>
                <div className={styles.time_column}>
                    <TimeColumn
                        isHidden={false}
                        startHour={0}
                        endHour={23}
                    />
                </div>
                <div className={styles.right_columns}>
                    {calendarContext.dateRange.map((date, index) => (
                        <DayColumn
                            key={dateToKey(date)}
                            date={date}
                            isRightmost={index === calendarContext.dateRange.length - 1}
                        />
                    ))}
                </div>
            </div>
            <TaskModal
                open={calendarContext.isTaskModalOpen}
                onClose={calendarContext.closeTaskModal}
                onTaskCreate={(data) => {
                    if (data.task) {
                        updateTasks(prev => [...prev, data.task!]);
                    }

                    if(data.timeBlock) {
                        updateTimeBlocks(prev => [...prev, data.timeBlock!]);
                    }
                }}
                onTaskUpdate={(data) => {
                    console.log("data", data);
                    if (data.task) {
                        updateTasks(prev =>
                            prev.map(t => t.id === data.task!.id ? data.task! : t)
                        );
                    }

                    if (data.deletedTimeBlockId) {
                        updateTimeBlocks(prev => 
                            prev.filter(tb => tb.id !== data.deletedTimeBlockId)
                        );
                        return;
                    }

                    if (data.timeBlock) {
                        updateTimeBlocks(prev => {
                            const exists = prev.some(tb => tb.id === data.timeBlock!.id);
                            
                            if (exists) {
                                return prev.map(tb =>
                                    tb.id === data.timeBlock!.id ? data.timeBlock! : tb
                                );
                            }
                            return [...prev, data.timeBlock!];
                        });
                    }
                }}
            />
            <WorkSessionModal
                open={calendarContext.isWorkSessionModalOpen}
                onClose={calendarContext.closeWorkSessionModal}
                onWorkSessionCreated={(data) => {
                    updateWorkSessions(prev => [...prev, data.workSession]);
                    updateTimeBlocks(prev => [...prev, data.timeBlock]);
                }}
            />
        </>
    );
}