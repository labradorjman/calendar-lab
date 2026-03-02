"use client";

import Modal, { ModalProps } from "@/components/Modal";
import styles from "./WorkSessionModal.module.scss";
import { createDefaultWorkSession, isTaskEqual, WorkSession } from "@/models/workSession";
import Input from "@/ui/Input";
import { useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { createWorkSession, deleteWorkSession, updateWorkSession } from "@/services/workSessionService";
import { createTimeBlock } from "@/services/timeBlockService";
import { removeWorkSessionFromStore } from "@/store/workSessions";
import { useCalendarContext } from "@/context";
import { ParsedDateParts } from "@/types/dateFormat";
import { ClearableHandle } from "@/types/componentHandles";
import { HourTime } from "@/utils/Time/HourTime";
import DateSelector from "@/ui/DateSelector";
import TimeInput from "@/ui/TimeInput";
import { TimeBlock } from "@/models/timeBlock";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { DATE_FORMAT, TIMEZONE } from "@/constants/calendar";
import { parseIsoDateParts } from "@/utils/dateParser";
import ColorSelector from "@/ui/ColorSelector";
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

export default function WorkSessionModal({ open, onClose, onWorkSessionCreate: onWorkSessionCreate, onWorkSessionUpdate}: WorkSessionModalProps) {
    const calendarContext = useCalendarContext();

    const [workSession, setWorkSession] = useState<Omit<WorkSession, "id">>(createDefaultWorkSession);
    const [startsAt, setStartsAt] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const [isWorkSessionEdited, setIsWorkSessionEdited] = useState<boolean>(false);
    const [isTimeBlockEdited, setIsTimeBlockEdited] = useState<boolean>(false);
    const [isTimeBlockValid, setIsTimeBlockValid] = useState<boolean>(false);

    const [parsedDateParts, setParsedDateParts] = useState<ParsedDateParts | null>(null);

    const dateRef = useRef<ClearableHandle>(null);
    const timeRef = useRef<ClearableHandle>(null);

    const dateValueRef = useRef<Date | null>(null);
    const hourTimeRef = useRef<HourTime | null>(null);

    const isClearing = useRef<boolean>(false);

    useEffect(() => {
        if (!open) return;

        setWorkSession(() => ({
            ...createDefaultWorkSession(),
            ...calendarContext.modalWorkSession?.workSession,
        }));

        const modal = calendarContext.modalWorkSession;
        if (!modal) return;

        setIsTimeBlockValid(
            modal.mode === "edit"
                ? modal.timeBlock?.startsAt != null && (modal.timeBlock?.duration ?? 0) > 0
                : startsAt != null && durationMinutes * 60 >= WORK_SESSION_MIN_DURATION_SECONDS
        );

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
        const modal = calendarContext.modalWorkSession;
        if (!modal || modal.mode !== "edit" || !modal.workSession) return;

        setIsWorkSessionEdited(!isTaskEqual(modal.workSession, workSession));
    }, [workSession, calendarContext.modalWorkSession]);

    useEffect(() => {
        const modal = calendarContext.modalWorkSession;
        if (!modal) return;
        
        setIsTimeBlockValid(
            startsAt != null &&
            durationMinutes * 60 >= WORK_SESSION_MIN_DURATION_SECONDS
        );

        const isEdited =
            modal.mode === "create"
                ? true
                : (modal.timeBlock?.startsAt !== startsAt ||
                modal.timeBlock?.duration !== durationMinutes * 60);

        setIsTimeBlockEdited(isEdited);
    }, [startsAt, durationMinutes, calendarContext.modalWorkSession]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWorkSession(prev => ({
            ...prev,
            name: e.target.value
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

        setParsedDateParts(parseIsoDateParts(newStart, DATE_FORMAT));
        setStartsAt(newStart);
    }
    
    const handleDateTimeClear = () => {
        setParsedDateParts(null);
        isClearing.current = true;
        dateRef.current?.clear();
        timeRef.current?.clear();
    }

    const handleCreate = async () => {
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
            console.error(`[Work session modal] Error creating work session.`);
            return;
        } else {
            onWorkSessionCreate({
                workSession: response?.workSession,
                timeBlock: response?.timeBlock,
            });
        }
        onClose();
    }

    const handleEdit = async () => {
        const modal = calendarContext.modalWorkSession;
        if (!modal || modal.mode !== "edit") return;


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
        } else {
            onWorkSessionUpdate({
                workSession: response?.workSession,
                timeBlock: response?.timeBlock,
            });
        }
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
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
                            onColorChange={(newColor: string) => {
                                setWorkSession(prev => ({
                                    ...prev,
                                    color: newColor,
                                }))
                            }}
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
                                (!isWorkSessionEdited &&
                                !isTimeBlockEdited &&
                                !isTimeBlockValid)
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