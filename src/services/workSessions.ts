import { WorkSession } from "@/models/workSession";

export async function createWorkSession(data: Omit<WorkSession, "id">): Promise<WorkSession> {
    const res = await fetch("/api/work-sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Failed to create work session");
    }

    const workSession: WorkSession = await res.json();
    return workSession;
}

export async function deleteWorkSession(id: number) {
    const res = await fetch(`/api/work-sessions/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete work session");
}