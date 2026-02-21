"use client";

import Modal, { ModalProps } from "@/components/Modal";
import styles from "./WorkSessionModal.module.scss";
import { createDefaultWorkSession, WorkSession } from "@/models/workSession";
import Input from "@/ui/Input";
import { useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { createWorkSession, deleteWorkSession } from "@/services/workSessions";
import { createTimeBlock } from "@/services/timeBlocks";
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
import { HexColorPicker } from "react-colorful";
import ColorSelector from "@/ui/ColorSelector";

interface WorkSessionModalProps extends Omit<ModalProps, "children"> {
    onWorkSessionCreated: (data: {
        workSession: WorkSession;
        timeBlock: TimeBlock;
    }) => void;
}

export default function WorkSessionModal({ open, onClose, onWorkSessionCreated}: WorkSessionModalProps) {
    const calendarContext = useCalendarContext();

    const [workSession, setWorkSession] = useState<Omit<WorkSession, "id">>(createDefaultWorkSession);
    const [startsAt, setStartsAt] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const [parsedDateParts, setParsedDateParts] = useState<ParsedDateParts | null>(null);

    const dateRef = useRef<ClearableHandle>(null);
    const timeRef = useRef<ClearableHandle>(null);

    const dateValueRef = useRef<Date | null>(null);
    const hourTimeRef = useRef<HourTime | null>(null);

    const startsAtRef = useRef<string | null>(null);

    useEffect(() => {
        if (!open) return;

        if (calendarContext.modalWorkSession) {
            setWorkSession(prev => ({
                ...prev,
                ...calendarContext.modalWorkSession!.session ?? {},
            }));

            const startsAt = calendarContext.modalWorkSession?.startsAt;
            if (startsAt) {
                setParsedDateParts(parseIsoDateParts(startsAt, DATE_FORMAT));
            }

            setDurationMinutes(() => {
                const durationSeconds = calendarContext.modalWorkSession?.duration;
                if (!durationSeconds || durationSeconds === 0) return 0;

                return Math.floor(durationSeconds / 60);
            });
        }
    }, [open]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWorkSession(prev => ({
            ...prev,
            name: e.target.value
        }));
    };

    const handleCreate = async () => {
        let session: WorkSession | null = null;
        try {
            session = await createWorkSession(workSession);

            const timeBlock = await createTimeBlock({
                workSessionId: session.id,
                startsAt: startsAt!,
                duration: durationMinutes,
            });
            onWorkSessionCreated({ workSession: session, timeBlock });
        } catch (err) {
            if (session) {
                await deleteWorkSession(session.id);
                removeWorkSessionFromStore(session.id);
            }
            throw err;
        }
        onClose();
    }

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === "") {
            setDurationMinutes(0);
            return;
        }

        let val = parseInt(e.target.value);
        if (isNaN(val)) return;

        setDurationMinutes(val);
    }

    const handleDateTimeChange = () => {
        if (!dateValueRef.current || !hourTimeRef.current) {
            setStartsAt(null);
            return;
        }

        const date = dateValueRef.current!;
        date.setHours(0, 0, 0, 0);

        const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });
        const totalUnixSeconds = calendarDate.startSeconds + hourTimeRef.current!.toSecondsSince();

        const startsAt = new Date(totalUnixSeconds * 1000).toISOString();
        if (startsAt === startsAtRef.current) return;
        
        startsAtRef.current = startsAt;
        setStartsAt(startsAt);
    }
    
    const handleDateTimeClear = () => {
        dateRef.current?.clear();
        timeRef.current?.clear();
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
                </div>
                <div className={styles.bottom}>
                    <Button
                        element="button"
                        onClick={handleCreate}
                        disabled={!workSession?.name.trim()
                            || startsAt === null
                            || durationMinutes === 0
                        }
                    >
                        Create
                    </Button>
                </div>
            </div>
        </Modal>
    );
}