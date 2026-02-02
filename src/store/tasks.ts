import { Task } from "@/models/task";
import { Store } from "@tanstack/react-store";

export const tasks_store = new Store<Task[]>([]);

export async function deleteTaskFromStore(id: number) {
    const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("Failed to delete task");
    }

    tasks_store.setState((prev) =>
        prev.filter((task) => task.id !== id)
    );
}