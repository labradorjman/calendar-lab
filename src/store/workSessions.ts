import { WorkSession } from "@/models/workSession";
import { Store } from "@tanstack/react-store";

export const work_sessions_store = new Store<WorkSession[]>([]);

// export async function deleteWorkSessionFromStore(id: number) {
//     const res = await fetch(`/api/tasks/${id}`, {
//         method: "DELETE",
//     });

//     if (!res.ok) {
//         throw new Error("Failed to delete task");
//     }

//     tasks_store.setState((prev) =>
//         prev.filter((task) => task.id !== id)
//     );
// }