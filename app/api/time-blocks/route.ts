import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { getNextId } from "@/utils/storage/meta";
import { TimeBlock } from "@/models/timeBlock";
import { TIME_BLOCKS_FILE } from "@/constants/fileNames";

export async function GET() {
    const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);
    return NextResponse.json(timeBlocks);
}

export async function POST(request: Request) {
    const input: Omit<TimeBlock, "id"> = await request.json();

    const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);

    const timeBlock: TimeBlock = {
        id: await getNextId("time_block"),
        ...input,
    };

    timeBlocks.push(timeBlock);
    await writeJson(TIME_BLOCKS_FILE, timeBlocks);

    return NextResponse.json(timeBlock, { status: 201 });
}