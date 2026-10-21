import type { TaskRef } from './tasks';

function groupByText(tasks: TaskRef[]): Map<string, TaskRef[]> {
	const groups = new Map<string, TaskRef[]>();
	for (const t of tasks) {
		const group = groups.get(t.text);
		if (group) group.push(t);
		else groups.set(t.text, [t]);
	}
	return groups;
}

/**
 * Pairs tasks in `next` with their counterpart in `prev` by text and line order,
 * returning those for which `keep(now, before)` holds. A text whose count changed
 * between snapshots is ambiguous and skipped.
 */
function changedTasks(prev: TaskRef[], next: TaskRef[], keep: (now: TaskRef, before: TaskRef) => boolean): TaskRef[] {
	const before = groupByText(prev);
	const result: TaskRef[] = [];
	for (const [text, group] of groupByText(next)) {
		const old = before.get(text);
		if (!old || old.length !== group.length) continue;
		group.forEach((t, i) => {
			if (keep(t, old[i] as TaskRef)) result.push(t);
		});
	}
	return result.sort((a, b) => a.line - b.line);
}

/** Tasks the user just ticked: unchecked in `prev`, checked now, and not yet stamped. */
export function newlyChecked(prev: TaskRef[], next: TaskRef[]): TaskRef[] {
	return changedTasks(prev, next, (t, was) => t.checked && !was.checked && t.doneDate === null);
}

/** Tasks the user just unticked back to open that still carry a done stamp. Cancelling keeps the stamp. */
export function newlyUnchecked(prev: TaskRef[], next: TaskRef[]): TaskRef[] {
	return changedTasks(prev, next, (t, was) => was.checked && !t.checked && !t.cancelled && t.doneDate !== null);
}
