import { TimeBlock } from "@/models/timeBlock";
import { Store } from "@tanstack/react-store";

export const time_blocks_store = new Store<TimeBlock[]>([]);

export function removeTimeBlockFromStore(id: number) {
    time_blocks_store.setState(prev =>
        prev.filter(timeBlock => timeBlock.id !== id)
    );
}