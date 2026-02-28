import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { TASKS_FILE, TIME_BLOCKS_FILE } from "@/constants/fileNames";
import { Task } from "@/models/task";
import { TimeBlock } from "@/models/timeBlock";
import { getNextId } from "@/utils/storage/meta";

export async function PATCH(
  req: NextRequest,
  context: { params: any }
) {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
            { error: "[Task] Invalid id" },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const { task, timeBlock } = body;

        const tasks = await readJson<Task[]>(TASKS_FILE, []);
        const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);

        const taskIndex = tasks.findIndex(t => t.id === id);

        if (taskIndex === -1) {
            return NextResponse.json(
                { error: "[Task] Not found" },
                { status: 404 }
            );
        }

        const updatedTask: Task = {
            ...tasks[taskIndex],
            ...(task ?? {}),
            id,
        };

        let updatedTimeBlock: TimeBlock | null = null;
        let deletedTimeBlockId: number | undefined;

        if (timeBlock === null) {
            // Delete timeBlock
            const index = timeBlocks.findIndex(tb => tb.taskId === id);

            if (index !== -1) {
                deletedTimeBlockId = timeBlocks[index].id;
                timeBlocks.splice(index, 1);
            }
        }
        else if (timeBlock) {
            if (timeBlock.id) {
                // Update an existing timeblock
                console.log("updating timeblock");
                const tbIndex = timeBlocks.findIndex(tb => tb.id === timeBlock.id);

                if (tbIndex === -1) {
                    return NextResponse.json(
                        { error: "[TimeBlock] Not found" },
                        { status: 404 }
                    );
                }

                const newTimeBlock: TimeBlock = {
                    ...timeBlocks[tbIndex],
                    ...timeBlock,
                    taskId: id,
                };

                timeBlocks[tbIndex] = newTimeBlock;
                updatedTimeBlock = newTimeBlock;
            } else {
                // Create a new timeblock
                const newId = await getNextId("time_block");

                updatedTimeBlock = {
                    id: newId,
                    taskId: id,
                    startsAt: timeBlock.startsAt,
                    duration: timeBlock.duration,
                };

                timeBlocks.push(updatedTimeBlock);
            }
        }

        // ⭐ commit both writes together
        tasks[taskIndex] = updatedTask;

        await Promise.all([
            writeJson(TASKS_FILE, tasks),
            writeJson(TIME_BLOCKS_FILE, timeBlocks),
        ]);
        console.log("updated time block", updatedTimeBlock);
        return NextResponse.json({
            task: updatedTask,
            timeBlock: updatedTimeBlock,
            ...(deletedTimeBlockId !== undefined && { deletedTimeBlockId }),
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
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
