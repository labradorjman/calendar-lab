import { Task } from "@/models/task";
import { TimeBlock } from "@/models/timeBlock";

type UpdateTaskRequest = {
    task?: Partial<Task>;
    timeBlock?: {
        id?: number;
        startsAt: string | null;
        duration: number;
    } | null;
};

type UpdateTaskResponse = {
    task: Task;
    timeBlock: TimeBlock | null;
    deletedTimeBlockId?: number;
};

export async function updateTask(
    id: number,
    request: UpdateTaskRequest
): Promise<UpdateTaskResponse> {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!res.ok) throw new Error("Failed to update task");

    return res.json();
}

type CreateTaskRequest = {
    task: Omit<Task, "id">;
    timeBlock?: {
        startsAt: string | null;
        duration: number;
    } | null;
};

type CreateTaskResponse = {
    task: Task;
    timeBlock: TimeBlock | null;
};


export async function createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        throw new Error("Failed to create task");
    }

    return res.json();
}

export async function deleteTask(id: number) {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete task");
}
