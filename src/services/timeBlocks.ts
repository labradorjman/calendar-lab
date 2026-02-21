import { TimeBlock } from "@/models/timeBlock";

export async function createTimeBlock(data: Omit<TimeBlock, "id">): Promise<TimeBlock> {
    const res = await fetch("/api/time-blocks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Failed to time block session");
    }

    const timeBlock: TimeBlock = await res.json();
    return timeBlock;
}