import Input from "@/ui/Input";
import styles from "./TaskModal.module.scss";

import { useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { createDefaultTask, isTaskEqual, type Task } from "@/models/task";

import Checkbox from "@/ui/Checkbox";
import { useCalendarContext } from "@/context";
import { createTask, updateTask } from "@/services/taskService";
import Modal, { ModalProps } from "@/components/Modal";
import DateSelector from "@/ui/DateSelector";
import TimeInput from "@/ui/TimeInput";
import { HourTime } from "@/utils/Time/HourTime";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { DATE_FORMAT, TIMEZONE } from "@/constants/calendar";
import { ClearableHandle } from "@/types/componentHandles";
import { ParsedDateParts } from "@/types/dateFormat";
import { parseIsoDateParts } from "@/utils/dateParser";
import { TimeBlock } from "@/models/timeBlock";
import { handlePromise } from "@/utils/handleError";

interface TaskModalProps extends Omit<ModalProps, "children"> {
    onTaskCreate: (data: {
        task?: Task;
        timeBlock?: TimeBlock | null;
    }) => void;
    onTaskUpdate: (data: {
        task?: Task;
        timeBlock?: TimeBlock | null;
        deletedTimeBlockId?: number;
    }) => void;
}

export default function TaskModal({ open, onClose, onTaskCreate: onTaskCreate, onTaskUpdate }: TaskModalProps) {
    const calendarContext = useCalendarContext();

    const [task, setTask] = useState<Omit<Task, "id">>(createDefaultTask);
    const [startsAt, setStartsAt] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const [isTaskEdited, setIsTaskEdited] = useState<boolean>(false);
    const [isTimeBlockEdited, setIsTimeBlockEdited] = useState<boolean>(false);

    const [parsedDateParts, setParsedDateParts] = useState<ParsedDateParts | null>(null);

    const dateRef = useRef<ClearableHandle>(null);
    const timeRef = useRef<ClearableHandle>(null);

    const dateValueRef = useRef<Date | null>(null);
    const hourTimeRef = useRef<HourTime | null>(null);

    const isClearing = useRef<boolean>(false);

    useEffect(() => {
        if (!open || !calendarContext.modalTask) return;

        setTask(()=> ({
            ...createDefaultTask(),
            ...calendarContext.modalTask?.task,
        }));

        const modal = calendarContext.modalTask;
        if (!modal) return;

        const modalStartsAt =
            modal.mode === "edit"
                ? modal.timeBlock?.startsAt
                : modal.startsAt;

        if (modalStartsAt) {
            setParsedDateParts(parseIsoDateParts(modalStartsAt, DATE_FORMAT));
        }

        setDurationMinutes(() => {
            const durationSeconds =
                modal.mode === "edit"
                    ? modal.timeBlock?.duration
                    : modal.duration;
                    
            if (!durationSeconds || durationSeconds === 0) return 0;

            return Math.floor(durationSeconds / 60);
        });
    }, [open]);

    useEffect(() => {
        const modal = calendarContext.modalTask;
        if (!modal || modal.mode !== "edit" || !modal.task) return;

        setIsTaskEdited(!isTaskEqual(modal.task, task));
    }, [task, calendarContext.modalTask]);

    useEffect(() => {
        const modal = calendarContext.modalTask;
        if (!modal || modal.mode !== "edit") return;

        const isEdited =
            modal.timeBlock?.startsAt !== startsAt ||
            modal.timeBlock?.duration !== durationMinutes * 60;

        setIsTimeBlockEdited(isEdited);
    }, [startsAt, durationMinutes, calendarContext.modalTask]);

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

    const handleDateTimeChange = (element: "date" | "time") => {
        if (isClearing.current) {
            isClearing.current = false;

            if (element === "date") return;
        }

        if (!dateValueRef.current || !hourTimeRef.current) {
            setStartsAt(null);
            return;
        }

        const date = dateValueRef.current!;
        date.setHours(0, 0, 0, 0);

        const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });
        const totalUnixSeconds = calendarDate.startSeconds + hourTimeRef.current!.toSecondsSince();

        const newStart = new Date(totalUnixSeconds * 1000).toISOString();
        if (newStart === startsAt) return;
        
        setStartsAt(newStart);
    }

    const handleDateTimeClear = () => {
        setParsedDateParts(null);
        isClearing.current = true;
        dateRef.current?.clear();
        timeRef.current?.clear();
    }

    const handleCreate = async () => {
        const taskToCreate: Omit<Task, "id"> = {
            ...task,
            isBacklogged: !startsAt,
            createdAt: new Date().toISOString(),
        }

        const timeBlockPayload = startsAt === null && durationMinutes === 0
            ? null
            : {
                startsAt: startsAt,
                duration: durationMinutes * 60,
            }

        const [response, error] = await handlePromise(
            createTask({
                task: taskToCreate,
                timeBlock: timeBlockPayload,
            })
        );

        if (error) {
            console.error(`[Task Modal] Error creating task.`);
            return;
        } else {
            onTaskCreate({
                task: response?.task,
                timeBlock: response?.timeBlock,
            });
        }

        onClose();
    }

    const handleEdit = async () => {
        const modal = calendarContext.modalTask;
        if (!modal || modal.mode !== "edit") return;

        const hasTimeBlock = startsAt !== null || durationMinutes !== 0;
        const timeBlockPayload = modal.timeBlock
            ? (startsAt === null && durationMinutes === 0
                ? null
                : {
                    id: modal.timeBlock.id,
                    startsAt: startsAt,
                    duration: durationMinutes * 60,
                })
            : {
                startsAt: startsAt,
                duration: durationMinutes * 60,
            };

        const [response, error] = await handlePromise(
            updateTask(modal.task.id, {
                task: {
                ...task,
                ...(startsAt === null ? { isBacklogged: true } : {}),
                },
                timeBlock: timeBlockPayload,
            })
        );

        if (error) {
            console.error(`[Task Modal] Error editing task [${modal.task.id}]`);
            return;
        } else {
            onTaskUpdate({
                task: response?.task,
                timeBlock: response?.timeBlock,
                deletedTimeBlockId: response?.deletedTimeBlockId,
            });
        }
        onClose();
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
                                    handleDateTimeChange("date");
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
                                    handleDateTimeChange("time");
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
                    {calendarContext.modalTask?.mode === "create" && (
                        <Button
                            element="button"
                            onClick={handleCreate}
                            disabled={!task.name.trim()}
                        >
                            Create
                        </Button>
                    )}
                    {calendarContext.modalTask?.mode === "edit" && (
                        <Button
                            element="button"
                            onClick={handleEdit}
                            disabled={
                                !task.name.trim() ||
                                (!isTaskEdited &&
                                !isTimeBlockEdited)
                            }
                        >
                            Edit
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}