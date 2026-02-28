import { NextResponse } from "next/server";
import { TASKS_FILE, TIME_BLOCKS_FILE } from "@/constants/fileNames";
import { Task } from "@/models/task";
import { readJson, writeJson } from "@/utils/storage/file";
import { getNextId } from "@/utils/storage/meta";
import { TimeBlock } from "@/models/timeBlock";

export async function GET() {
    const tasks = await readJson<Task[]>(TASKS_FILE, []);
    return NextResponse.json(tasks);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { task, timeBlock } = body;

        const tasks = await readJson<Task[]>(TASKS_FILE, []);
        const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);
        const writes: Promise<unknown>[] = [];

        let newTimeBlock: TimeBlock | null = null;
        const newTask: Task = {
            id: await getNextId("task"),
            ...task,
        };
        
        tasks.push(newTask);
        writes.push(writeJson(TASKS_FILE, tasks));

        if (timeBlock) {
            const newId = await getNextId("time_block");

            newTimeBlock = {
                id: newId,
                taskId: newTask.id,
                startsAt: timeBlock.startsAt,
                duration: timeBlock.duration,
            };

            timeBlocks.push(newTimeBlock);
            writes.push(writeJson(TIME_BLOCKS_FILE, timeBlocks));
        }

        await Promise.all(writes);

        return NextResponse.json({
            task: newTask,
            timeBlock: newTimeBlock,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}