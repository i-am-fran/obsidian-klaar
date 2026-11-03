import { isInProgress, meaningOf, type TagRule } from './tagRules';
import { tagsOf } from './taskFields';
import { fenceAfter, indentWidth, parseTaskLine, taskBlockEnd, type MarkerSettings, type ParsedLine } from './taskLine';

export interface SortOptions {
	markers: MarkerSettings;
	rules: TagRule[];
	/** `[/]` means in progress; off, it reads as open. */
	slashInProgress: boolean;
}

/** Lower comes first: in progress, next, open, someday, question, idea, done, cancelled; priority orders the open and parked groups. */
function rank(parsed: ParsedLine, options: SortOptions): number {
	if (parsed.cancelled) return 70;
	if (parsed.checked) return 60;
	const meaning = meaningOf(tagsOf(parsed.text), options.rules);
	const byPriority = 3 - meaning.priority;
	if (parsed.idea) return 50 + byPriority;
	if (parsed.question) return 40 + byPriority;
	if (parsed.someday) return 30 + byPriority;
	if (isInProgress(parsed, meaning, options.slashInProgress)) return byPriority;
	if (parsed.next) return 10 + byPriority;
	return 20 + byPriority;
}

/**
 * The note's lines with each list of top-level tasks put in order (see `rank`), subtasks moving with their task and ties
 * keeping their place. A list is a run of top-level tasks with nothing between them, so headings, blank lines, plain
 * bullets, text and code blocks all end one. Null when every list is already in order.
 */
export function sortTaskLists(lines: string[], options: SortOptions): string[] | null {
	const out: string[] = [];
	let list: { rank: number; lines: string[] }[] = [];
	const flush = (sort: boolean) => {
		const ordered = sort ? [...list].sort((a, b) => a.rank - b.rank) : list;
		out.push(...ordered.flatMap((block) => block.lines));
		list = [];
	};
	let fence: string | null = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] as string;
		const parsed = fence === null && indentWidth(line) === 0 ? parseTaskLine(line, options.markers) : null;
		if (parsed) {
			const end = taskBlockEnd(lines, i);
			const block = lines.slice(i, end);
			list.push({ rank: rank(parsed, options), lines: block });
			i = end - 1;
			fence = block.reduce(fenceAfter, null);
			// A block that leaves a code block open (a blank line inside a subtask's code) ends its list unsorted, so
			// nothing moves into the code.
			if (fence !== null) flush(false);
			continue;
		}
		flush(true);
		fence = fenceAfter(fence, line);
		out.push(line);
	}
	flush(true);
	return out.every((line, i) => line === lines[i]) ? null : out;
}
