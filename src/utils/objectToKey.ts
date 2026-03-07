import { WorkSession } from "@/models/workSession";

export function dateToKey (date: Date) {
    return `date-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function workSessionToKey(workSession: WorkSession) {
    return `ws-${workSession.id}`;
}