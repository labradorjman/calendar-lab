import { NextResponse } from "next/server";
import { TASKS_FILE } from "@/constants/fileNames";
import { Task } from "@/models/task";
import { readJson, writeJson } from "@/utils/storage/file";
import { getNextId } from "@/utils/storage/meta";

export async function GET() {
    const tasks = await readJson<Task[]>(TASKS_FILE, []);
    return NextResponse.json(tasks);
}

export async function POST(request: Request) {
    const input: Omit<Task, "id"> = await request.json();

    const tasks = await readJson<Task[]>(TASKS_FILE, []);

    const task: Task = {
        id: await getNextId("task"),
        ...input,
    };

    tasks.push(task);
    await writeJson(TASKS_FILE, tasks);

    return NextResponse.json(task, { status: 201 });
}