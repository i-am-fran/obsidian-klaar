import { locateTaskLine, type TaskRef } from './tasks';
import { ALL_MARKERS, indentWidth, outdentBlock, parseTaskLine, setSchedule, taskBlockEnd, type MarkerSettings } from './taskLine';

/** A task line and its subtasks: lines `start` up to (not including) `end`. */
export interface TaskBlock {
	start: number;
	end: number;
	lines: string[];
}

const FENCE = /^\s*(```|~~~)/;

/** The block of the task `ref` points at, re-located if the note changed; null if it can't be found. */
export function blockAt(lines: string[], ref: Pick<TaskRef, 'line' | 'raw'>): TaskBlock | null {
	const start = locateTaskLine(lines, ref);
	if (start === null) return null;
	const end = taskBlockEnd(lines, start);
	return { start, end, lines: lines.slice(start, end) };
}

/** A block as it goes into a period note: at the margin, and without the top task's schedule link (the note is its date). */
export function blockForPeriodNote(block: string[]): string[] {
	const [first, ...rest] = outdentBlock(block);
	return first === undefined ? [] : [setSchedule(first, null), ...rest];
}

export function removeLines(lines: string[], start: number, end: number): string[] {
	return [...lines.slice(0, start), ...lines.slice(end)];
}

export function insertLines(lines: string[], at: number, block: string[]): string[] {
	return [...lines.slice(0, at), ...block, ...lines.slice(at)];
}

/** Where `block` sits in `lines`, line for line; null when it isn't there, or is there more than once. */
export function findBlock(lines: string[], block: string[]): number | null {
	if (block.length === 0) return null;
	let found: number | null = null;
	for (let i = 0; i + block.length <= lines.length; i++) {
		if (!block.every((line, j) => lines[i + j] === line)) continue;
		if (found !== null) return null;
		found = i;
	}
	return found;
}

/** Blocks of the task lines among `lineNumbers`, in order; a task inside an earlier block goes with it. */
export function blocksForLines(lines: string[], lineNumbers: number[], markers: MarkerSettings = ALL_MARKERS): TaskBlock[] {
	const blocks: TaskBlock[] = [];
	for (const n of [...lineNumbers].sort((a, b) => a - b)) {
		const last = blocks[blocks.length - 1];
		if (last && n < last.end) continue;
		if (!parseTaskLine(lines[n] ?? '', markers)) continue;
		const end = taskBlockEnd(lines, n);
		blocks.push({ start: n, end, lines: lines.slice(n, end) });
	}
	return blocks;
}

/** `lines` with each block's task line scheduled to `key` (null removes the link); subtasks are left alone. */
export function scheduleBlocks(lines: string[], blocks: TaskBlock[], key: string | null): string[] {
	const next = [...lines];
	for (const b of blocks) next[b.start] = setSchedule(b.lines[0] as string, key);
	return next;
}

/** Every open (not done, cancelled or someday) task at the margin, with its subtasks; tasks in code blocks are skipped. */
export function openTopLevelBlocks(lines: string[], markers: MarkerSettings = ALL_MARKERS): TaskBlock[] {
	const blocks: TaskBlock[] = [];
	let inFence = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] as string;
		if (FENCE.test(line)) {
			inFence = !inFence;
			continue;
		}
		if (inFence || indentWidth(line) !== 0) continue;
		const task = parseTaskLine(line, markers);
		if (!task || task.checked || task.cancelled || task.someday) continue;
		const end = taskBlockEnd(lines, i);
		blocks.push({ start: i, end, lines: lines.slice(i, end) });
		i = end - 1;
	}
	return blocks;
}
