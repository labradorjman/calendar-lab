import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { TIME_BLOCKS_FILE, WORK_SESSIONS_FILE } from "@/constants/fileNames";
import { WorkSession } from "@/models/workSession";
import { getNextId } from "@/utils/storage/meta";
import { TimeBlock } from "@/models/timeBlock";

export async function GET() {
    const workSessions = await readJson<WorkSession[]>(WORK_SESSIONS_FILE, []);
    return NextResponse.json(workSessions);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { workSession, timeBlock } = body;

        const workSessions = await readJson<WorkSession[]>(WORK_SESSIONS_FILE, []);
        const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);

        let newTimeBlock: TimeBlock | null = null;
        const newWorkSession: WorkSession = {
            id: await getNextId("work_session"),
            ...workSession,
        };
        
        workSessions.push(newWorkSession);

        const newId = await getNextId("time_block");
        newTimeBlock = {
            id: newId,
            workSessionId: newWorkSession.id,
            startsAt: timeBlock.startsAt,
            duration: timeBlock.duration,
        };

        timeBlocks.push(newTimeBlock);

        await Promise.all([
            writeJson(WORK_SESSIONS_FILE, workSessions),
            writeJson(TIME_BLOCKS_FILE, timeBlocks),
        ]);

        return NextResponse.json({
            workSession: newWorkSession,
            timeBlock: newTimeBlock,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to create work session" },
            { status: 500 }
        );
    }
}