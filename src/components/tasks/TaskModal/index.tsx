import Input from "@/ui/Input";
import styles from "./TaskModal.module.scss";

import { useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { createDefaultTask, type Task } from "@/models/task";

import Checkbox from "@/ui/Checkbox";
import { useCalendarContext } from "@/context";
import { createTask } from "@/services/tasks";
import Modal, { ModalProps } from "@/components/Modal";
import DateSelector from "@/ui/DateSelector";
import TimeInput from "@/ui/TimeInput";
import { HourTime } from "@/utils/Time/HourTime";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { DATE_FORMAT, TIMEZONE } from "@/constants/calendar";
import { ClearableHandle } from "@/types/componentHandles";
import { ParsedDateParts } from "@/types/dateFormat";
import { parseIsoDateParts } from "@/utils/dateParser";

interface TaskModalProps extends Omit<ModalProps, "children"> {
    onTaskCreated: (task: Task) => void;
}

export default function TaskModal({ open, onClose, onTaskCreated }: TaskModalProps) {
    const calendarContext = useCalendarContext();

    const [task, setTask] = useState<Omit<Task, "id">>(createDefaultTask);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const [parsedDateParts, setParsedDateParts] = useState<ParsedDateParts | null>(null);

    const dateRef = useRef<ClearableHandle>(null);
    const timeRef = useRef<ClearableHandle>(null);

    const dateValueRef = useRef<Date | null>(null);
    const hourTimeRef = useRef<HourTime | null>(null);

    const startsAtRef = useRef<string | null>(null);

    useEffect(() => {
        if (!open) return;

        if (calendarContext.modalTask) {
            setTask(prev => ({
                ...prev,
                ...calendarContext.modalTask,
            }));

            const startsAt = calendarContext.modalTask.startsAt;
            if (startsAt) {
                setParsedDateParts(parseIsoDateParts(startsAt, DATE_FORMAT));
            }

            setDurationMinutes(() => {
                const durationSeconds = calendarContext.modalTask?.duration;
                if (!durationSeconds || durationSeconds === 0) return 0;

                return Math.floor(durationSeconds / 60);
            });
        }
    }, [open]);
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTask(prev => ({
            ...prev,
            name: e.target.value
        }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTask(prev => ({
            ...prev,
            description: e.target.value
        }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === "") {
            setDurationMinutes(0);
            return;
        }

        let val = parseInt(e.target.value);
        if (isNaN(val)) return;

        setDurationMinutes(val);

        setTask(prev => ({
            ...prev,
            duration: val * 60,
        }));
    };

    const handleIsImportantChange = (value: boolean) => {
        setTask(prev => ({
            ...prev,
            isImportant: value
        }));
    }

    const handleCreate = () => {
        const taskToCreate: Omit<Task, "id"> = {
            ...task,
            isBacklogged: !task.startsAt,
            createdAt: new Date().toISOString(),
        }
        const createdTask = createTask(taskToCreate);
        createdTask.then(task => {
            onTaskCreated(task);
            setTask(createDefaultTask());
        });
        setParsedDateParts(null);
        onClose();
    }

    const handleDateTimeChange = () => {
        if (!dateValueRef.current || !hourTimeRef.current) {
            setTask(prev => ({
                ...prev,
                startsAt: null,
            }));
            return;
        }

        const date = dateValueRef.current!;
        date.setHours(0, 0, 0, 0);

        const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });
        const totalUnixSeconds = calendarDate.startSeconds + hourTimeRef.current!.toSecondsSince();

        const startsAt = new Date(totalUnixSeconds * 1000).toISOString();
        if (startsAt === startsAtRef.current) return;
        
        startsAtRef.current = startsAt;
        setParsedDateParts(parseIsoDateParts(startsAt, DATE_FORMAT));
        setTask(prev => ({
            ...prev,
            startsAt
        }));
    }

    const handleDateTimeClear = () => {
        dateRef.current?.clear();
        timeRef.current?.clear();
    }

    return (
        <Modal
            open={open}
            onClose={() => {
                setParsedDateParts(null);
                onClose();
            }}
        >
            <div className={styles.task_modal}>
                <div className={styles.content}>
                    <div className={`${styles.input_area} ${styles.name_input}`}>
                        <span className={styles.label}>Name</span>
                        <Input
                            placeholder=""
                            value={task.name}
                            onChange={handleNameChange}
                        />
                    </div>
                    <div className={`${styles.input_area} ${styles.description_input}`}>
                        <span className={styles.label}>Description</span>
                        <Input
                            placeholder=""
                            value={task.description ?? ""}
                            onChange={handleDescriptionChange}
                        />
                    </div>
                    <div className={`${styles.input_area} ${styles.duration_input}`}>
                        <span className={styles.label}>Duration</span>
                        <Input
                            placeholder=""
                            value={durationMinutes}
                            onChange={handleDurationChange}
                            suffix="mins"
                        />
                    </div>
                    <div className={`${styles.input_area} ${styles.date_input}`}>
                        <span className={styles.label}>Starts at</span>

                        <div className={styles.date_row}>
                            <DateSelector
                                ref={dateRef}
                                defaultValue={parsedDateParts?.formattedDate}
                                onDateChange={(date: Date | null) => {
                                    dateValueRef.current = date;
                                    handleDateTimeChange();
                                }}
                            />
                            <TimeInput
                                ref={timeRef}
                                defaultValue={
                                parsedDateParts
                                    ? {
                                        time12: parsedDateParts.time12,
                                        meridiem: parsedDateParts.meridiem,
                                    }
                                    : undefined
                                }
                                onTimeChange={(hourTime: HourTime | null) => {
                                    hourTimeRef.current = hourTime;
                                    handleDateTimeChange();
                                }}
                            />
                            <span onClick={handleDateTimeClear}>Clear</span>
                        </div>
                    </div>
                    <Checkbox
                        className={styles.important_check}
                        label="Important"
                        defaultValue={false}
                        checked={task.isImportant}
                        onChange={handleIsImportantChange}
                    />
                </div>
                <div className={styles.bottom}>
                    <Button
                        element="button"
                        onClick={handleCreate}
                        disabled={!task.name.trim()}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </Modal>
    );
}