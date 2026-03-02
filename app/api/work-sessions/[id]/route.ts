import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { WORK_SESSIONS_FILE, TIME_BLOCKS_FILE } from "@/constants/fileNames";
import { WorkSession } from "@/models/workSession";
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
            { error: "[Work session] Invalid id" },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const { workSession, timeBlock } = body;

        const workSessions = await readJson<WorkSession[]>(WORK_SESSIONS_FILE, []);
        const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);

        const workSessionIndex = workSessions.findIndex(ws => ws.id === id);

        if (workSessionIndex === -1) {
            return NextResponse.json(
                { error: "[Work session] Not found" },
                { status: 404 }
            );
        }

        const updatedWorkSession: WorkSession = {
            ...workSessions[workSessionIndex],
            ...(workSession ?? {}),
            id,
        };

        let updatedTimeBlock: TimeBlock | null = null;

        if (timeBlock) {
            if (timeBlock.id) {
                // Update an existing timeblock
                const tbIndex = timeBlocks.findIndex(tb => tb.id === timeBlock.id);

                if (tbIndex === -1) {
                    return NextResponse.json(
                        { error: "[Work session] Time block not found" },
                        { status: 404 }
                    );
                }

                const newTimeBlock: TimeBlock = {
                    ...timeBlocks[tbIndex],
                    ...timeBlock,
                    workSessionId: id,
                };

                timeBlocks[tbIndex] = newTimeBlock;
                updatedTimeBlock = newTimeBlock;
            } else {
                // Create a new timeblock
                const newId = await getNextId("time_block");

                updatedTimeBlock = {
                    id: newId,
                    workSessionId: id,
                    startsAt: timeBlock.startsAt,
                    duration: timeBlock.duration,
                };

                timeBlocks.push(updatedTimeBlock);
            }
        }

        workSessions[workSessionIndex] = updatedWorkSession;

        await Promise.all([
            writeJson(WORK_SESSIONS_FILE, workSessions),
            writeJson(TIME_BLOCKS_FILE, timeBlocks),
        ]);
        
        return NextResponse.json({
            workSession: updatedWorkSession,
            timeBlock: updatedTimeBlock,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to update work session" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const workSessionId = Number(id);

    if (!Number.isInteger(workSessionId) || workSessionId <= 0) {
        return new NextResponse(null, { status: 400 });
    }
    
    try {
        const writes: Promise<unknown>[] = [];
        let deletedWorkSessionId: number | undefined;
        let deletedTimeBlockId: number | undefined;

        const workSessions = await readJson<WorkSession[]>(WORK_SESSIONS_FILE, []);
        const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);
        const workSessionIndex = workSessions.findIndex((t) => t.id === workSessionId);

        if (workSessionIndex === -1) {
            return NextResponse.json(
                { error: `Work session not found. Unable to delete work session. id [${workSessionId}]` },
                { status: 404 }
            );
        }

        deletedWorkSessionId = workSessionId;
        workSessions.splice(workSessionIndex, 1);
        writes.push(writeJson(WORK_SESSIONS_FILE, workSessions));

        const index = timeBlocks.findIndex(tb => tb.workSessionId === workSessionId);
        if (index !== -1) {
            deletedTimeBlockId = timeBlocks[index].id;
            timeBlocks.splice(index, 1);
            writes.push(writeJson(TIME_BLOCKS_FILE, timeBlocks));
        }

        await Promise.all(writes);

        return NextResponse.json({
            deletedWorkSessionId,
            deletedTimeBlockId,
        });

    } catch (err) {
        return NextResponse.json(
            { error: "Failed to delete work session" },
            { status: 500 }
        );
    }
}