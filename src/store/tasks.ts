import { Task } from "@/models/task";
import { Store } from "@tanstack/react-store";

export const tasks_store = new Store<Task[]>([]);

export function removeTaskFromStore(id: number) {
    tasks_store.setState(prev =>
        prev.filter(task => task.id !== id)
    );
}
