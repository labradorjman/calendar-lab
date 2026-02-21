import { Task } from "@/models/task";

export async function updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
}

export async function createTask(data: Omit<Task, "id">): Promise<Task> {
    const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Failed to create task");
    }

    const task: Task = await res.json();
    return task;
}

export async function deleteTask(id: number) {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete task");
}
