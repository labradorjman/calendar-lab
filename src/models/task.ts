export interface Task {
    id: number,
    userId: number,
    workSessionId: number | null,
    name: string,
    description: string | null,
    tag1Id: number | null,
    tag2Id: number | null,
    orderIndex: number,             // Default 1
    isImportant: boolean,
    isBacklogged: boolean,
    isCompleted: boolean,
    softDeadline: string | null,
    completedAt: string | null,
    createdAt: string,
}

export function createDefaultTask(): Omit<Task, "id">{
    return {
        userId: 1,
        workSessionId: null,
        name: "",
        description: null,
        tag1Id: null,
        tag2Id: null,
        orderIndex: 1,
        isImportant: false,
        isBacklogged: false,
        isCompleted: false,
        softDeadline: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
    };
}

function normalize(value: any) {
    return value === null || value === "" ? null : value;
}

export function isTaskEqual(
    a: Task | Omit<Task, "id">,
    b: Task | Omit<Task, "id">
): boolean {
    return (
        a.userId === b.userId &&
        a.workSessionId === b.workSessionId &&
        a.name === b.name &&
        normalize(a.description) === normalize(b.description) &&
        normalize(a.tag1Id) === normalize(b.tag1Id) &&
        normalize(a.tag2Id) === normalize(b.tag2Id) &&
        a.orderIndex === b.orderIndex &&
        a.isImportant === b.isImportant &&
        a.isBacklogged === b.isBacklogged &&
        a.isCompleted === b.isCompleted &&
        normalize(a.softDeadline) === normalize(b.softDeadline) &&
        normalize(a.completedAt) === normalize(b.completedAt) &&
        a.createdAt === b.createdAt
    );
}