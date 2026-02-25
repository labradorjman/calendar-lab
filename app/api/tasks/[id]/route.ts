import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { TASKS_FILE } from "@/constants/fileNames";
import { Task } from "@/models/task";

export async function PATCH(
    req: NextRequest,
    context: { params: any }
) {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "[Task] Invalid id" }, { status: 400 });
    }

    const body: Partial<Task> = await req.json();
    const tasks = await readJson<Task[]>(TASKS_FILE, []);

    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
        return NextResponse.json({ error: "[Task] Not found" }, { status: 404 });
    }

    const updatedTask: Task = {
        ...tasks[index],
        ...body,
        id,
    };

    tasks[index] = updatedTask;
    await writeJson(TASKS_FILE, tasks);

    return NextResponse.json(updatedTask);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
        return new NextResponse(null, { status: 400 });
    }

    const tasks = await readJson<Task[]>(TASKS_FILE, []);
    const index = tasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
        return new NextResponse(null, { status: 404 });
    }

    tasks.splice(index, 1);
    await writeJson(TASKS_FILE, tasks);

    return new NextResponse(null, { status: 204 });
}
