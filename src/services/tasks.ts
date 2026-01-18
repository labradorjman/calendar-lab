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