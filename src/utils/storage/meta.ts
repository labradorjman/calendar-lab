"use server";

import { readJson, writeJson } from "./file";

export type CounterType = "task" | "work_session" | "time_block";

interface MetaData {
    counters: Record<CounterType, number>;
}

const META_FILE = "meta.json";

const DEFAULT_META: MetaData = {
    counters: {
        task: 1,
        work_session: 1,
        time_block: 1,
    }
};

export async function getNextId(type: CounterType): Promise<number> {
    const meta = await readJson(META_FILE, DEFAULT_META);

    const id = meta.counters[type];
    meta.counters[type]++;

    await writeJson(META_FILE, meta);
    return id;
}
