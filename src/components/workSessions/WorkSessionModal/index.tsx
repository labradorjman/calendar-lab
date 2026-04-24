"use client";

import Modal, { ModalProps } from "@/components/Modal";
import styles from "./WorkSessionModal.module.scss";
import { createDefaultWorkSession, isTaskEqual, WorkSession } from "@/models/workSession";
import Input from "@/components/ui/Input";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { createWorkSession, updateWorkSession } from "@/services/workSessionService";
import { useCalendarContext } from "@/context";
import { ClearableHandle } from "@/types/componentHandles";
import { HourTime } from "@/utils/Time/HourTime";
import DateSelector from "@/components/ui/DateSelector";
import TimeInput from "@/components/ui/TimeInput";
import { TimeBlock } from "@/models/timeBlock";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { DATE_FORMAT, TIMEZONE } from "@/constants/calendar";
import { parseIsoDateParts } from "@/utils/dateParser";
import ColorSelector from "@/components/ui/ColorSelector";
import { handlePromise } from "@/utils/handleError";
import { WORK_SESSION_MIN_DURATION_SECONDS } from "@/constants/limits";

interface WorkSessionModalProps extends Omit<ModalProps, "children"> {
    onWorkSessionCreate: (data: {
        workSession?: WorkSession;
        timeBlock?: TimeBlock;
    }) => void;
    onWorkSessionUpdate: (data: {
        workSession?: WorkSession;
        timeBlock?: TimeBlock | null;
    }) => void;
}

export default function WorkSessionModal({ open, onClose, onWorkSessionCreate, onWorkSessionUpdate }: WorkSessionModalProps) {
    const calendarContext = useCalendarContext();

    const [workSession, setWorkSession] = useState<Omit<WorkSession, "id">>(createDefaultWorkSession);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const [isWorkSessionEdited, setIsWorkSessionEdited] = useState<boolean>(false);
    const [isTimeBlockEdited, setIsTimeBlockEdited] = useState<boolean>(false);
    const [isTimeBlockValid, setIsTimeBlockValid] = useState<boolean>(false);

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
        if (!open) return;

        const modal = calendarContext.modalWorkSession;

        setWorkSession({ ...createDefaultWorkSession(), ...modal?.workSession });
        setIsWorkSessionEdited(false);
        setIsTimeBlockEdited(false);

        const modalStartsAt =
            modal?.mode === "edit"
                ? modal.timeBlock?.startsAt ?? null
                : modal?.startsAt ?? null;

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
            modal?.mode === "edit"
                ? modal.timeBlock?.duration
                : modal?.duration;

        const resolvedMinutes = durationSeconds && durationSeconds > 0
            ? Math.floor(durationSeconds / 60)
            : 0;

        setDurationMinutes(resolvedMinutes);

        setIsTimeBlockValid(
            modal?.mode === "edit"
                ? modal.timeBlock?.startsAt != null && (modal.timeBlock?.duration ?? 0) >= WORK_SESSION_MIN_DURATION_SECONDS
                : false
        );
    }, [open]);

    useEffect(() => {
        const modal = calendarContext.modalWorkSession;
        if (!modal || modal.mode !== "edit" || !modal.workSession) return;
        
        setIsWorkSessionEdited(!isTaskEqual(modal.workSession, workSession));
    }, [workSession, calendarContext.modalWorkSession]);

    const handleDateTimeChange = () => {
        if (!dateValueRef.current || !hourTimeRef.current) {
            startsAtRef.current = null;
            updateValidityAndEdited(null, durationMinutes);
            return;
        }

        const date = new Date(dateValueRef.current);
        date.setHours(0, 0, 0, 0);

        const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });
        const totalUnixSeconds = calendarDate.startSeconds + hourTimeRef.current.toSecondsSince();
        const newStart = new Date(totalUnixSeconds * 1000).toISOString();

        startsAtRef.current = newStart;
        updateValidityAndEdited(newStart, durationMinutes);
    };

    const updateValidityAndEdited = (newStartsAt: string | null, minutes: number) => {
        const modal = calendarContext.modalWorkSession;

        const durationSeconds = minutes * 60;
        setIsTimeBlockValid(
            newStartsAt != null && durationSeconds >= WORK_SESSION_MIN_DURATION_SECONDS
        );

        if (!modal) return;

        const isEdited =
            modal.mode === "create"
                ? true
                : modal.timeBlock?.startsAt !== newStartsAt ||
                  modal.timeBlock?.duration !== durationSeconds;

        setIsTimeBlockEdited(isEdited);
    };

    const handleDateTimeClear = () => {
        dateRef.current?.clear();
        timeRef.current?.clear();
        dateValueRef.current = null;
        hourTimeRef.current = null;
        startsAtRef.current = null;
        updateValidityAndEdited(null, durationMinutes);
    };

    // Field change
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWorkSession(prev => ({ ...prev, name: e.target.value }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === "") {
            setDurationMinutes(0);
            updateValidityAndEdited(startsAtRef.current, 0);
            return;
        }
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;

        setDurationMinutes(val);
        updateValidityAndEdited(startsAtRef.current, val);
    };

    // Create
    const handleCreate = async () => {
        const startsAt = startsAtRef.current;

        const [response, error] = await handlePromise(
            createWorkSession({
                workSession,
                timeBlock: {
                    startsAt: startsAt!,
                    duration: durationMinutes * 60,
                },
            })
        );

        if (error) {
            console.error("[Work session modal] Error creating work session.");
            return;
        }

        onWorkSessionCreate({
            workSession: response?.workSession,
            timeBlock: response?.timeBlock,
        });
        onClose();
    };

    const handleEdit = async () => {
        const modal = calendarContext.modalWorkSession;
        if (!modal || modal.mode !== "edit") return;

        const startsAt = startsAtRef.current;

        const [response, error] = await handlePromise(
            updateWorkSession(modal.workSession.id, {
                workSession,
                timeBlock: {
                    id: modal.timeBlock?.id,
                    startsAt: startsAt!,
                    duration: durationMinutes * 60,
                },
            })
        );

        if (error) {
            console.error(`[Work session modal] Error editing work session [${modal.workSession.id}]`);
            return;
        }

        onWorkSessionUpdate({
            workSession: response?.workSession,
            timeBlock: response?.timeBlock,
        });
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div className={styles.work_session_modal}>
                <div className={styles.content}>
                    <div className={`${styles.input_area} ${styles.name_input}`}>
                        <span className={styles.label}>Name</span>
                        <Input
                            placeholder=""
                            value={workSession?.name ?? ""}
                            onChange={handleNameChange}
                        />
                    </div>
                    <div className={`${styles.input_area} ${styles.color_input}`}>
                        <span className={styles.label}>Color</span>
                        <ColorSelector
                            color={workSession.color}
                            onColorChange={(newColor: string) =>
                                setWorkSession(prev => ({ ...prev, color: newColor }))
                            }
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
                </div>
                <div className={styles.bottom}>
                    {calendarContext.modalWorkSession?.mode === "create" && (
                        <Button
                            element="button"
                            onClick={handleCreate}
                            disabled={!workSession.name.trim() || !isTimeBlockValid}
                        >
                            Create
                        </Button>
                    )}
                    {calendarContext.modalWorkSession?.mode === "edit" && (
                        <Button
                            element="button"
                            onClick={handleEdit}
                            disabled={
                                !workSession.name.trim() ||
                                (!isWorkSessionEdited && !isTimeBlockEdited) ||
                                !isTimeBlockValid
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