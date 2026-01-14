export interface Task {
    id: number,
    userId: number,
    workSessionId: number | null,
    name: string,
    description: string | null,
    tag1Id: number | null,
    tag2Id: number | null,
    orderIndex: number,             // Default 1
    startsAt: string | null,
    duration: number,               // Default 0
    isImportant: boolean,
    isBacklogged: boolean,
    isCompleted: boolean,
    softDeadline: string | null,
    completedAt: string | null,
    createdAt: string,
}