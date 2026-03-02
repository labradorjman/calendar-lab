import { TimeBlock } from "@/models/timeBlock";
import { WorkSession } from "@/models/workSession";

type UpdateWorkSessionRequest = {
    workSession?: Partial<WorkSession>;
    timeBlock?: {
        id?: number;
        startsAt: string | null;
        duration: number;
    } | null;
};

type UpdateWorkSessionResponse = {
    workSession: WorkSession;
    timeBlock: TimeBlock | null;
};

export async function updateWorkSession(
    id: number,
    request: UpdateWorkSessionRequest
): Promise<UpdateWorkSessionResponse> {
    const res = await fetch(`/api/work-session/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!res.ok) throw new Error("Failed to update work session");

    return res.json();
}

type CreateWorkSessionRequest = {
    workSession: Omit<WorkSession, "id">;
    timeBlock: {
        startsAt: string;
        duration: number;
    };
};

type CreateWorkSessionResponse = {
    workSession: WorkSession;
    timeBlock: TimeBlock;
};

export async function createWorkSession(request: CreateWorkSessionRequest): Promise<CreateWorkSessionResponse> {
    const res = await fetch("/api/work-sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        throw new Error("Failed to create work session");
    }

    return res.json();
}

type DeleteWorkSessionResponse = {
    deletedWorkSessionId?: number;
    deletedTimeBlockId?: number;
}

export async function deleteWorkSession(id: number): Promise<DeleteWorkSessionResponse> {
    const res = await fetch(`/api/work-sessions/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete work session");

    return res.json();
}