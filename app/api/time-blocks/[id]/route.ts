import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/utils/storage/file";
import { TimeBlock } from "@/models/timeBlock";
import { TIME_BLOCKS_FILE } from "@/constants/fileNames";

export async function PATCH(
    req: NextRequest,
    context: { params: any }
) {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "[Time Block] Invalid id" }, { status: 400 });
    }

    const body: Partial<TimeBlock> = await req.json();
    const timeBlocks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);

    const index = timeBlocks.findIndex(t => t.id === id);

    if (index === -1) {
        return NextResponse.json({ error: "[Time Block] Not found" }, { status: 404 });
    }

    const updatedTimeBlock: TimeBlock = {
        ...timeBlocks[index],
        ...body,
        id,
    };

    timeBlocks[index] = updatedTimeBlock;
    await writeJson(TIME_BLOCKS_FILE, timeBlocks);

    return NextResponse.json(updatedTimeBlock);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = await params;
    const timeBlockId = Number(id);

    if (!Number.isInteger(timeBlockId) || timeBlockId <= 0) {
        return new NextResponse(null, { status: 400 });
    }

    const tasks = await readJson<TimeBlock[]>(TIME_BLOCKS_FILE, []);
    const index = tasks.findIndex((t) => t.id === timeBlockId);

    if (index === -1) {
        return new NextResponse(null, { status: 404 });
    }

    tasks.splice(index, 1);
    await writeJson(TIME_BLOCKS_FILE, tasks);

    return new NextResponse(null, { status: 204 });
}
