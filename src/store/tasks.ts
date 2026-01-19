import { Task } from "@/models/task";
import { Store } from "@tanstack/react-store";

export const tasks_store = new Store<Task[]>([]);