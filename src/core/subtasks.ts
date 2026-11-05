import { parseInline, type InlineNode } from './inlineMarkdown';
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

/**
 * The parent's text as a short plain label: links by their label, styles and code without their marks, no tags; the
 * raw text when that leaves nothing.
 */
export function parentLabel(text: string): string {
	return plain(parseInline(text)).replace(/\s+/g, ' ').trim() || text.trim();
}

function plain(nodes: InlineNode[]): string {
	return nodes
		.map((n) => ('text' in n ? n.text : 'code' in n ? n.code : 'label' in n ? n.label : 'children' in n ? plain(n.children) : ''))
		.join('');
}
