import { NextResponse } from "next/server";
import { readJson } from "@/storage/file";
import { TASKS_FILE } from "@/constants/fileNames";
import { Task } from "@/models/task";

export async function GET() {
    const tasks = await readJson<Task[]>(TASKS_FILE, []);
    return NextResponse.json(tasks);
}