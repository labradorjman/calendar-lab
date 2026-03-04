import { WorkSession } from "@/models/workSession";

export function dateToKey (date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function workSessionToKey(workSession: WorkSession) {
    return `ws-${workSession.id}`;
}