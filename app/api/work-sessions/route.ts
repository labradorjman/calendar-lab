import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { WORK_SESSIONS_FILE } from "@/constants/fileNames";
import { WorkSession } from "@/models/workSession";
import { getNextId } from "@/utils/storage/meta";

export async function GET() {
    const workSessions = await readJson<WorkSession[]>(WORK_SESSIONS_FILE, []);
    return NextResponse.json(workSessions);
}

export async function POST(request: Request) {
    const input: Omit<WorkSession, "id"> = await request.json();

    const workSessions = await readJson<WorkSession[]>(WORK_SESSIONS_FILE, []);

    const session: WorkSession = {
        id: await getNextId("work_session"),
        ...input,
    };

    workSessions.push(session);
    await writeJson(WORK_SESSIONS_FILE, workSessions);

    return NextResponse.json(session, { status: 201 });
}