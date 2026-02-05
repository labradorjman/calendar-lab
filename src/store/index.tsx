import { Store, useStore } from "@tanstack/react-store";
import { tasks_store } from "./tasks";
import { Task } from "@/models/task";
import { work_sessions_store } from "./workSessions";
import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import { time_blocks_store } from "./timeBlocks";

export type StoreType = {
    tasks: Task[];
    work_sessions: WorkSession[];
    time_blocks: TimeBlock[];
};

const stores = new Map<keyof StoreType, Store<any>>([
    ["tasks", tasks_store],
    ["work_sessions", work_sessions_store],
    ["time_blocks", time_blocks_store],
]);

export default function useCalendarStore<T extends keyof StoreType>(type: T) {
    const found = stores.get(type) as Store<StoreType[T]> | undefined;

    if (found === undefined) {
        throw new Error(
            `Store "${type}" could not be found. It's possible that the store was not initialized.`
        );
    }

    const state = useStore(found);
    const setState = (valueOrUpdater: StoreType[T] | ((prev: StoreType[T]) => StoreType[T])) => {
        if (typeof valueOrUpdater === "function") {
            found.setState(valueOrUpdater as (prev: StoreType[T]) => StoreType[T]);
        } else {
            found.setState(() => valueOrUpdater);
        }
    };

    return [state, setState] as const;
}