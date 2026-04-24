import Input from "@/components/ui/Input";
import styles from "./TaskModal.module.scss";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { createDefaultTask, isTaskEqual, type Task } from "@/models/task";

import Checkbox from "@/components/ui/Checkbox";
import { useCalendarContext } from "@/context";
import { createTask, updateTask } from "@/services/taskService";
import Modal, { ModalProps } from "@/components/Modal";
import DateSelector from "@/components/ui/DateSelector";
import TimeInput from "@/components/ui/TimeInput";
import { HourTime } from "@/utils/Time/HourTime";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { DATE_FORMAT, TIMEZONE } from "@/constants/calendar";
import { ClearableHandle } from "@/types/componentHandles";
import { parseIsoDateParts } from "@/utils/dateParser";
import { TimeBlock } from "@/models/timeBlock";
import { handlePromise } from "@/utils/handleError";

interface TaskModalProps extends Omit<ModalProps, "children"> {
    onTaskCreate: (data: { task?: Task; timeBlock?: TimeBlock | null }) => void;
    onTaskUpdate: (data: { task?: Task; timeBlock?: TimeBlock | null; deletedTimeBlockId?: number }) => void;
}

export default function TaskModal({ open, onClose, onTaskCreate, onTaskUpdate }: TaskModalProps) {
    const calendarContext = useCalendarContext();

    const [task, setTask] = useState<Omit<Task, "id">>(createDefaultTask);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const [isTaskEdited, setIsTaskEdited] = useState<boolean>(false);
    const [isTimeBlockEdited, setIsTimeBlockEdited] = useState<boolean>(false);

    const startsAtRef = useRef<string | null>(null);

    const [inputKey, setInputKey] = useState(0);
    const [initialDateStr, setInitialDateStr] = useState<string | undefined>(undefined);
    const [initialTimeValue, setInitialTimeValue] = useState<{ time12: string; meridiem: "AM" | "PM" } | undefined>(undefined);

    const dateRef = useRef<ClearableHandle>(null);
    const timeRef = useRef<ClearableHandle>(null);

    const dateValueRef = useRef<Date | null>(null);
    const hourTimeRef = useRef<HourTime | null>(null);

    // On modal open
    useEffect(() => {
        if (!open || !calendarContext.modalTask) return;

        const modal = calendarContext.modalTask;

        // Reset fields
        setTask({ ...createDefaultTask(), ...modal.task });
        setIsTaskEdited(false);
        setIsTimeBlockEdited(false);

        const modalStartsAt =
            modal.mode === "edit"
                ? modal.timeBlock?.startsAt ?? null
                : modal.startsAt ?? null;

        if (modalStartsAt) {
            const parts = parseIsoDateParts(modalStartsAt, DATE_FORMAT);
            setInitialDateStr(parts.formattedDate);
            setInitialTimeValue({ time12: parts.time12, meridiem: parts.meridiem });

            startsAtRef.current = modalStartsAt;
            dateValueRef.current = new Date(modalStartsAt);
        } else {
            setInitialDateStr(undefined);
            setInitialTimeValue(undefined);
            startsAtRef.current = null;
            dateValueRef.current = null;
            hourTimeRef.current = null;
        }

        setInputKey(prev => prev + 1);

        const durationSeconds =
            modal.mode === "edit"
                ? modal.timeBlock?.duration
                : modal.duration;

        setDurationMinutes(durationSeconds && durationSeconds > 0
            ? Math.floor(durationSeconds / 60)
            : 0
        );
    }, [open]);

    useEffect(() => {
        const modal = calendarContext.modalTask;
        if (!modal || modal.mode !== "edit" || !modal.task) return;

        setIsTaskEdited(!isTaskEqual(modal.task, task));
    }, [task, calendarContext.modalTask]);

    const handleDateTimeChange = () => {
        if (!dateValueRef.current || !hourTimeRef.current) {
            startsAtRef.current = null;

            updateTimeBlockEdited(null);
            return;
        }

        const date = new Date(dateValueRef.current);
        date.setHours(0, 0, 0, 0);

        const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });
        const totalUnixSeconds = calendarDate.startSeconds + hourTimeRef.current.toSecondsSince();
        const newStart = new Date(totalUnixSeconds * 1000).toISOString();

        startsAtRef.current = newStart;
        updateTimeBlockEdited(newStart);
    };

    const updateTimeBlockEdited = (newStartsAt: string | null) => {
        const modal = calendarContext.modalTask;
        if (!modal || modal.mode !== "edit") return;

        const isEdited =
            modal.timeBlock?.startsAt !== newStartsAt ||
            modal.timeBlock?.duration !== durationMinutes * 60;

        setIsTimeBlockEdited(isEdited);
    };

    const handleDateTimeClear = () => {
        dateRef.current?.clear();
        timeRef.current?.clear();
        dateValueRef.current = null;
        hourTimeRef.current = null;
        startsAtRef.current = null;
        updateTimeBlockEdited(null);
    };

    // Field change
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTask(prev => ({ ...prev, name: e.target.value }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTask(prev => ({ ...prev, description: e.target.value }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === "") {
            setDurationMinutes(0);
            return;
        }
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;

        setDurationMinutes(val);
        setTask(prev => ({ ...prev, duration: val * 60 }));
    };

    const handleIsImportantChange = (value: boolean) => {
        setTask(prev => ({ ...prev, isImportant: value }));
    };

    // Create
    const handleCreate = async () => {
        const startsAt = startsAtRef.current;

        const taskToCreate: Omit<Task, "id"> = {
            ...task,
            isBacklogged: !startsAt,
            createdAt: new Date().toISOString(),
        };

        const timeBlockPayload =
            startsAt === null && durationMinutes === 0
                ? null
                : { startsAt, duration: durationMinutes * 60 };

        const [response, error] = await handlePromise(
            createTask({ task: taskToCreate, timeBlock: timeBlockPayload })
        );

        if (error) {
            console.error("[Task Modal] Error creating task.");
            return;
        }

        onTaskCreate({ task: response?.task, timeBlock: response?.timeBlock });
        onClose();
    };

    const handleEdit = async () => {
        const modal = calendarContext.modalTask;
        if (!modal || modal.mode !== "edit") return;

        const startsAt = startsAtRef.current;

        const timeBlockPayload = modal.timeBlock
            ? (startsAt === null && durationMinutes === 0
                ? null
                : {
                    id: modal.timeBlock.id,
                    startsAt,
                    duration: durationMinutes * 60,
                })
            : { startsAt, duration: durationMinutes * 60 };

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
        }

        onTaskUpdate({
            task: response?.task,
            timeBlock: response?.timeBlock,
            deletedTimeBlockId: response?.deletedTimeBlockId,
        });
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <div className={styles.task_modal}>
                <div className={styles.content}>
                    <div className={`${styles.input_area} ${styles.name_input}`}>
                        <span className={styles.label}>Name</span>
                        <Input placeholder="" value={task.name} onChange={handleNameChange} />
                    </div>
                    <div className={`${styles.input_area} ${styles.description_input}`}>
                        <span className={styles.label}>Description</span>
                        <Input placeholder="" value={task.description ?? ""} onChange={handleDescriptionChange} />
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
                                key={`date-${inputKey}`}
                                ref={dateRef}
                                initialValue={initialDateStr}
                                onDateChange={(date) => {
                                    dateValueRef.current = date;
                                    handleDateTimeChange();
                                }}
                            />
                            <TimeInput
                                key={`time-${inputKey}`}
                                ref={timeRef}
                                initialValue={initialTimeValue}
                                onTimeChange={(hourTime) => {
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
                            disabled={!task.name.trim() || (!isTaskEdited && !isTimeBlockEdited)}
                        >
                            Edit
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}