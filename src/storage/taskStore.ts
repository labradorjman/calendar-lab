"use server";

import type { Task } from "@/models/task";
import { readJson, writeJson } from "./file";
import { getNextId } from "./meta";
import { TASKS_FILE } from "@/constants/fileNames";

export async function loadTasks(): Promise<Task[]> {
    return readJson<Task[]>(TASKS_FILE, []);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
    writeJson(TASKS_FILE, tasks);
}

export async function createTask(
    input: Omit<Task, "id">
): Promise<Task> {
    const tasks = await loadTasks();

    const task: Task = {
        id: await getNextId("task"),
        ...input
    };

    tasks.push(task);
    saveTasks(tasks);

    return task;
}

