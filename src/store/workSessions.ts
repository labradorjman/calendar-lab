import { WorkSession } from "@/models/workSession";
import { Store } from "@tanstack/react-store";

export const work_sessions_store = new Store<WorkSession[]>([]);

export function removeWorkSessionFromStore(id: number) {
    work_sessions_store.setState(prev =>
        prev.filter(session => session.id !== id)
    );
}