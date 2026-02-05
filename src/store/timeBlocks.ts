import { TimeBlock } from "@/models/timeBlock";
import { Store } from "@tanstack/react-store";

export const time_blocks_store = new Store<TimeBlock[]>([]);