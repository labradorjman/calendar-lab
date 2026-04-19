"use client";

import styles from "./Content.module.scss";

import { useCalendarContext } from "@/context";
import DayColumn from "./DayColumn";
import { useCallback, useEffect, useRef } from "react";
import TimeColumn from "./TimeColumn";
import TaskModal from "@/components/tasks/TaskModal";
import useCalendarStore from "@/store";
import { dateToKey } from "@/utils/objectToKey";
import WorkSessionModal from "../workSessions/WorkSessionModal";
import SimpleBar from "simplebar-react";
import DayHeader from "./DayHeader";
import SimpleBarCore from "simplebar-core";

export default function Content() {
    const calendarContext = useCalendarContext();

    const [, updateTasks] = useCalendarStore("tasks");
    const [, updateWorkSessions] = useCalendarStore("work_sessions");
    const [, updateTimeBlocks] = useCalendarStore("time_blocks");

   const simpleBarRef = useCallback((node: SimpleBarCore | null) => {
        if (node) {
            calendarContext.scrollElementRef.current = node.getScrollElement();
        } else {
            calendarContext.scrollElementRef.current = null;
        }
    }, []);
    
    return (
        <>
            <div className={styles.calendar}>
                <div className={styles.headers}>
                    <div className={styles.empty} />
                    
                    <div className={styles.day_headers}>
                        {calendarContext.dateRange.map((date) => (
                            <DayHeader key={dateToKey(date)} date={date} />
                        ))}
                    </div>
                </div>

                <SimpleBar ref={simpleBarRef} className={styles.simplebar}>
                    <div className="bg-[#202020] h-[30px]"></div>
                    <div className={styles.content}>
                        <TimeColumn startHour={0} endHour={23} />

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
                </SimpleBar>
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
                onWorkSessionCreate={(data) => {
                    if (data.workSession) {
                        updateWorkSessions(prev => [...prev, data.workSession!]);
                    }

                    if (data.timeBlock) {
                        updateTimeBlocks(prev => [...prev, data.timeBlock!]);
                    }
                }}
                onWorkSessionUpdate={(data) => {
                    if (data.workSession) {
                        updateWorkSessions(prev =>
                            prev.map(ws => ws.id === data.workSession!.id ? data.workSession! : ws)
                        );
                    }

                    if (data.timeBlock) {
                        updateTimeBlocks(prev =>
                            prev.map(tb => tb.id === data.timeBlock!.id ? data.timeBlock! : tb)
                        );
                    }
                }}
            />
        </>
    );
}