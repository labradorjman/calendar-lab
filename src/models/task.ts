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