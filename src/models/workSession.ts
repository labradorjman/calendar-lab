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

function normalize(value: any) {
    return value === null || value === "" ? null : value;
}

export function isTaskEqual(
    a: WorkSession | Omit<WorkSession, "id">,
    b: WorkSession | Omit<WorkSession, "id">
): boolean {
    return (
        a.userId === b.userId &&
        a.name === b.name &&
        a.color === b.color &&
        a.isExtended === b.isExtended &&
        a.isCompleted === b.isCompleted &&
        normalize(a.completedAt) === normalize(b.completedAt)
    );
}