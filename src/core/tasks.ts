import type { IsoDate } from './dates';
import type { Period } from './periods';
import { isInProgress, meaningOf, type TagRule } from './tagRules';
import { headingAt, tagsOf } from './taskFields';
import type { HeadingPos } from './taskFields';
import { ALL_MARKERS, parseTaskLine } from './taskLine';
import type { MarkerSettings, Priority } from './taskLine';

export interface TaskRef {
	path: string;
	line: number;
	raw: string;
	/** `[x]` or `[X]`. */
	checked: boolean;
	/** `[-]`: neither open nor done. */
	cancelled: boolean;
	/** `[<]`: parked for someday, neither open nor done. */
	someday: boolean;
	/** `[>]`: open, to pick up next. */
	next: boolean;
	text: string;
	/** Effective period: the explicit link, otherwise the note's own period. */
	scheduleKey: string | null;
	explicit: boolean;
	doneDate: IsoDate | null;
	/** `[/]` (when that marker is in use) or a tag whose rule is "In progress". */
	inProgress: boolean;
	/** Highest priority among its tags' rules, 3 = high; 0 for none. */
	priority: Priority;
	/** The tag (lower case, no `#`) of the status rule that puts it in its own board column; null for none. */
	status: string | null;
	/** Inline `#tags` in the text. */
	tags: string[];
	/** Nearest heading above the task, if any. */
	heading: string | null;
	/** Nested, at any depth, under another Klaar task. */
	subtask: boolean;
}

/**
 * Builds task records for the listed lines; lines that are not tasks are skipped. `useMarker`: `[/]` means in progress.
 * `markers`: whether `[>]` and `[<]` are tasks. `parents`: each list item's line to its parent item's line (none, or
 * negative, at the top of a list), so a task under another task, even through plain bullets, is a subtask.
 */
export function extractTasks(path: string, lines: string[], taskLines: number[], notePeriod: Period | null, headings: HeadingPos[] = [], rules: TagRule[] = [], useMarker = false, markers: MarkerSettings = ALL_MARKERS, parents: ReadonlyMap<number, number> = new Map()): TaskRef[] {
	const tasks: TaskRef[] = [];
	for (const line of taskLines) {
		const raw = lines[line];
		if (raw === undefined) continue;
		const parsed = parseTaskLine(raw, markers);
		if (!parsed) continue;
		const explicit = parsed.scheduleKey !== null;
		const tags = tagsOf(parsed.text);
		const meaning = meaningOf(tags, rules);
		tasks.push({
			path,
			line,
			raw,
			checked: parsed.checked,
			cancelled: parsed.cancelled,
			someday: parsed.someday,
			next: parsed.next,
			text: parsed.text,
			scheduleKey: explicit ? parsed.scheduleKey : (notePeriod?.key ?? null),
			explicit,
			doneDate: parsed.doneDate,
			inProgress: isInProgress(parsed, meaning, useMarker),
			priority: meaning.priority,
			status: meaning.status,
			tags,
			heading: headingAt(headings, line),
			subtask: false,
		});
	}
	// Only Klaar tasks count as parents: a child of `[!]` or plain text stays top level, so hiding subtasks never hides it.
	const taskAt = new Set(tasks.map((t) => t.line));
	for (const task of tasks) task.subtask = hasTaskAbove(task.line, lines, parents, taskAt);
	return tasks;
}

/** Leading whitespace and blockquote `>`s: how far in the list marker sits. */
function indent(line: string | undefined): number {
	return /^[\s>]*/.exec(line ?? '')?.[0].length ?? 0;
}

/**
 * Walks up the list. A real parent sits above its child and further out: the top items of a list starting on line 0
 * get parent `-0`, which reads as line 0, and the indent check tells them apart from that item's children.
 */
function hasTaskAbove(line: number, lines: string[], parents: ReadonlyMap<number, number>, taskAt: Set<number>): boolean {
	for (let child = line, p = parents.get(line); p !== undefined && p >= 0 && p < child && indent(lines[p]) < indent(lines[child]); child = p, p = parents.get(p)) {
		if (taskAt.has(p)) return true;
	}
	return false;
}

/** Finds the task line again after the note changed; null when missing or ambiguous. */
export function locateTaskLine(lines: string[], ref: Pick<TaskRef, 'line' | 'raw'>): number | null {
	if (lines[ref.line] === ref.raw) return ref.line;
	let found: number | null = null;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i] !== ref.raw) continue;
		if (found !== null) return null;
		found = i;
	}
	return found;
}
