import { Task } from "@/models/task";
import { WorkSession } from "@/models/workSession";

export function dateToKey (date: Date) {
    return `date-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function workSessionToKey(workSession: WorkSession) {
    return `ws-${workSession.id}`;
}

export function taskToKey(task: Task) {
    return `task-${task.id}`;
}