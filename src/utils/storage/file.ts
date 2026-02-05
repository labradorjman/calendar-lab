"use server";

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");

export async function readJson<T>(
    file: string,
    fallback: T
): Promise<T> {
    const fullPath = path.join(DATA_DIR, file);

    try {
        const raw = await readFile(fullPath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err: any) {
        if (err.code === "ENOENT") {
        return fallback;
        }
        throw err;
    }
}

export async function writeJson<T>(
    file: string,
    data: T
): Promise<void> {
    const fullPath = path.join(DATA_DIR, file);

    await mkdir(path.dirname(fullPath), { recursive: true });

    await writeFile(
        fullPath,
        JSON.stringify(data, null, 2),
        "utf-8"
    );
}
