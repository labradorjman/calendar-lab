export interface WorkSession {
    id: number;
    userId: number;
    name: string;
    color: string;
    isExtended: boolean;
    isCompleted: boolean;
    completedAt: string | null,
}