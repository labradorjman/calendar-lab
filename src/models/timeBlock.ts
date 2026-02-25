export interface TimeBlock {
    id: number;
    taskId?: number;
    workSessionId?: number;
    startsAt: string;
    duration: number;
}