export interface WorkSession {
    id: number;
    userId: number;
    name: string;
    color: string;
    isExtended: boolean;
    isCompleted: boolean;
    completedAt: string | null,
}

export function createDefaultWorkSession(): Omit<WorkSession, "id">{
    return {
        userId: 1,
        name: "",
        color: "#28326c",
        isExtended: false,
        isCompleted: false,
        completedAt: null,
    };
}