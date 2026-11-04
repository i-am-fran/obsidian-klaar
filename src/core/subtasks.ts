import { withoutTags } from './taskFields';
import type { TaskRef } from './tasks';

/** The task `task` sits under, among `tasks` (usually its note's tasks); null for a top-level task. */
export function parentOf(tasks: readonly TaskRef[], task: TaskRef): TaskRef | null {
	if (task.parent === null) return null;
	return tasks.find((t) => t.path === task.path && t.line === task.parent) ?? null;
}

/**
 * How many of the task's direct subtasks are done, out of all of them. Cancelled ones are left out of both counts;
 * null when nothing is left to count.
 */
export function subtaskProgress(tasks: readonly TaskRef[], task: TaskRef): { done: number; total: number } | null {
	const children = tasks.filter((t) => t.path === task.path && t.parent === task.line && !t.cancelled);
	if (children.length === 0) return null;
	return { done: children.filter((t) => t.checked).length, total: children.length };
}

/** The parent's text as a short label: without tags, unless that leaves nothing. */
export function parentLabel(text: string): string {
	return withoutTags(text, () => true) || text.trim();
}
