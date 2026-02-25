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

export async function updateTimeBlock(id: number, data: Partial<TimeBlock>): Promise<TimeBlock> {
    const res = await fetch(`/api/time-blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update time block");
    
    return res.json();
}

export async function deleteTimeBlock(id: number) {
    const res = await fetch(`/api/time-blocks/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete task");
}
