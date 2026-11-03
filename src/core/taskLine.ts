import type { IsoDate } from './dates';
import { parsePeriodKey } from './periods';

export interface ParsedLine {
	/** `[x]` or `[X]`. */
	checked: boolean;
	/** `[-]`. */
	cancelled: boolean;
	/** `[/]`; whether that means in progress is a setting, so callers decide. */
	inProgress: boolean;
	/** `[>]`: open, to pick up next. */
	next: boolean;
	/** `[<]`: parked for someday, neither open nor done. */
	someday: boolean;
	/** `[?]`: a question, parked like someday. */
	question: boolean;
	/** `[I]`: an idea, parked like someday. */
	idea: boolean;
	/** Task text without the marker, the schedule link and the done stamp. */
	text: string;
	scheduleKey: string | null;
	doneDate: IsoDate | null;
}

/** 3 is the highest, 0 is none. */
export type Priority = 0 | 1 | 2 | 3;

/** Which of the optional markers are in use; a marker that is off is not a task, like any other unknown one. */
export interface MarkerSettings {
	/** `[>]` is next. */
	next: boolean;
	/** `[<]` is someday. */
	someday: boolean;
	/** `[?]` is a question. */
	question: boolean;
	/** `[I]` is an idea. */
	idea: boolean;
}

export const ALL_MARKERS: MarkerSettings = { next: true, someday: true, question: true, idea: true };

/** The marker settings out of the plugin settings. */
export function markersOf(settings: { nextMarker: boolean; somedayMarker: boolean; questionMarker: boolean; ideaMarker: boolean }): MarkerSettings {
	return { next: settings.nextMarker, someday: settings.somedayMarker, question: settings.questionMarker, idea: settings.ideaMarker };
}

/** The only markers Klaar treats as tasks; any other (`[!]`, `[i]`...) is left alone, like a plain bullet. */
const MARKER = /^(\s*[-*+] \[)([ xX\-/<>?I])(\] )/;
const DONE_STAMP = / \(@done \[\[(\d{4}-\d{2}-\d{2})\]\]\)\s*$/;
const SCHEDULE_LINK = />\[\[([^\]]*)\]\]/g;

interface LinkMatch {
	index: number;
	length: number;
	key: string;
}

/** Splits a task line into its marker prefix, body, done stamp and any trailing `\r` (CRLF notes). */
function split(raw: string) {
	const eol = raw.endsWith('\r') ? '\r' : '';
	const line = eol ? raw.slice(0, -1) : raw;
	const marker = MARKER.exec(line);
	if (!marker) return null;
	const rest = line.slice(marker[0].length);
	const stamp = DONE_STAMP.exec(rest);
	return {
		prefix: marker[1] ?? '',
		stateChar: marker[2] ?? ' ',
		suffix: marker[3] ?? '',
		body: stamp ? rest.slice(0, stamp.index) : rest,
		stamp: stamp ? stamp[0] : '',
		doneDate: stamp ? (stamp[1] as IsoDate) : null,
		eol,
	};
}

function isCheckedChar(c: string): boolean {
	return c === 'x' || c === 'X';
}

/** Every `>[[KEY]]` in the body whose KEY is a valid period key, in order. */
function scheduleLinks(body: string): LinkMatch[] {
	const found: LinkMatch[] = [];
	for (const m of body.matchAll(SCHEDULE_LINK)) {
		const key = m[1] ?? '';
		if (parsePeriodKey(key)) found.push({ index: m.index, length: m[0].length, key });
	}
	return found;
}

/** Removes the given links (in order, none overlapping) along with the space that separated each from its neighbour. */
function removeLinks(body: string, links: LinkMatch[]): string {
	let result = body;
	for (const link of [...links].reverse()) {
		const before = result.slice(0, link.index).replace(/\s+$/, '');
		const after = result.slice(link.index + link.length);
		result = before === '' ? after.replace(/^\s+/, '') : before + after;
	}
	return result;
}

/** Whether a marker that parses counts as a task with these settings. */
function markerInUse(c: string, markers: MarkerSettings): boolean {
	if (c === '>') return markers.next;
	if (c === '<') return markers.someday;
	if (c === '?') return markers.question;
	if (c === 'I') return markers.idea;
	return true;
}

/** Someday, question or idea, with that marker in use: a task parked out of the scheduled sections and open filters. */
export function isParkedMarker(c: string, markers: MarkerSettings): boolean {
	return (c === '<' || c === '?' || c === 'I') && markerInUse(c, markers);
}

/** Someday, question or idea: neither open nor done, out of the scheduled sections, the calendar and the open filters. */
export function isParked(t: { someday: boolean; question: boolean; idea: boolean }): boolean {
	return t.someday || t.question || t.idea;
}

/** Null for a line that is not a task, including one whose `[>]`, `[<]`, `[?]` or `[I]` marker is switched off in `markers`. */
export function parseTaskLine(line: string, markers: MarkerSettings = ALL_MARKERS): ParsedLine | null {
	const parts = split(line);
	if (!parts || !markerInUse(parts.stateChar, markers)) return null;
	const links = scheduleLinks(parts.body);
	const link = links[links.length - 1];
	const text = removeLinks(parts.body, links);
	return {
		checked: isCheckedChar(parts.stateChar),
		cancelled: parts.stateChar === '-',
		inProgress: parts.stateChar === '/',
		next: parts.stateChar === '>',
		someday: parts.stateChar === '<',
		question: parts.stateChar === '?',
		idea: parts.stateChar === 'I',
		text: text.replace(/\s+/g, ' ').trim(),
		scheduleKey: link ? link.key : null,
		doneDate: parts.doneDate,
	};
}

/** The character between the brackets (`' '`, `x`, `X`, `-`, `/`, `>`, `<`, `?`, `I`), or null for a line that is not a task. */
export function taskMarker(line: string): string | null {
	return split(line)?.stateChar ?? null;
}

export interface LineSpans {
	/** Every `>[[KEY]]` with a valid period key. */
	schedule: { from: number; to: number; key: string }[];
	/** The `(@done [[DATE]])` stamp, without the space before it. */
	done: { from: number; to: number; date: IsoDate } | null;
}

/** Where the schedule links and the done stamp sit in the line (offsets from the line start), for styling them. */
export function lineSpans(line: string): LineSpans {
	const parts = split(line);
	if (!parts) return { schedule: [], done: null };
	const bodyStart = parts.prefix.length + parts.stateChar.length + parts.suffix.length;
	const schedule = scheduleLinks(parts.body).map((l) => ({ from: bodyStart + l.index, to: bodyStart + l.index + l.length, key: l.key }));
	let done: LineSpans['done'] = null;
	if (parts.doneDate) {
		const from = bodyStart + parts.body.length + 1;
		done = { from, to: from + `(@done [[${parts.doneDate}]])`.length, date: parts.doneDate };
	}
	return { schedule, done };
}

/** Sets, moves or (with null) removes the schedule link. Non-task lines are returned unchanged. */
export function setSchedule(line: string, key: string | null): string {
	const parts = split(line);
	if (!parts) return line;
	const head = parts.prefix + parts.stateChar + parts.suffix;
	const links = scheduleLinks(parts.body);
	const last = links[links.length - 1];
	let body: string;
	if (last && key !== null) {
		const replaced = parts.body.slice(0, last.index) + `>[[${key}]]` + parts.body.slice(last.index + last.length);
		body = removeLinks(replaced, links.slice(0, -1));
	} else if (last) {
		body = removeLinks(parts.body, links);
	} else if (key !== null) {
		body = `${parts.body.trimEnd()} >[[${key}]]`;
	} else {
		body = parts.body;
	}
	return head + body + parts.stamp + parts.eol;
}

/** Ticks or unticks a task, adding or removing the done stamp. Non-task lines are returned unchanged. */
export function setChecked(line: string, checked: boolean, today: IsoDate, stampDone: boolean): string {
	const parts = split(line);
	if (!parts) return line;
	if (!checked) return parts.prefix + ' ' + parts.suffix + parts.body.trimEnd() + parts.eol;
	const stamp = parts.stamp || (stampDone ? ` (@done [[${today}]])` : '');
	const state = isCheckedChar(parts.stateChar) ? parts.stateChar : 'x';
	return parts.prefix + state + parts.suffix + parts.body.trimEnd() + stamp + parts.eol;
}

/** Markers of a task that is not finished: to do, in progress, next, someday, question and idea. */
export type OpenMarker = ' ' | '/' | '>' | '<' | '?' | 'I';

function isOpenChar(c: string): c is OpenMarker {
	return c === ' ' || c === '/' || c === '>' || c === '<' || c === '?' || c === 'I';
}

/** Swaps one unfinished marker for another; done and cancelled tasks and non-task lines are returned unchanged. */
export function setOpenMarker(line: string, marker: OpenMarker): string {
	const parts = split(line);
	if (!parts || !isOpenChar(parts.stateChar)) return line;
	return parts.prefix + marker + parts.suffix + parts.body + parts.stamp + parts.eol;
}

/** Turns the `[/]` marker on or off for an unfinished task; done and cancelled tasks and non-task lines are returned unchanged. */
export function setInProgressMarker(line: string, on: boolean): string {
	const parts = split(line);
	if (!parts || !isOpenChar(parts.stateChar)) return line;
	if (!on && parts.stateChar !== '/') return line;
	return setOpenMarker(line, on ? '/' : ' ');
}

/** Unticks a done, cancelled, someday, question or idea task, dropping the done stamp; open tasks (`[ ]`, `[/]`, `[>]`) and non-task lines are returned unchanged. */
export function reopenTask(line: string): string {
	const parts = split(line);
	if (!parts || parts.stateChar === ' ' || parts.stateChar === '/' || parts.stateChar === '>') return line;
	return parts.prefix + ' ' + parts.suffix + parts.body.trimEnd() + parts.eol;
}

/** `[ ]` when the task already has `marker`, otherwise `marker`, reopening a done or cancelled task first. */
function toggleMarker(line: string, marker: '>' | '<' | '?' | 'I'): string {
	const parts = split(line);
	if (!parts) return line;
	if (parts.stateChar === marker) return setOpenMarker(line, ' ');
	return setOpenMarker(reopenTask(line), marker);
}

/** `[ ]` ↔ `[>]`; any other task (in progress, someday, done, cancelled) becomes `[>]`, losing its done stamp. */
export function toggleNext(line: string): string {
	return toggleMarker(line, '>');
}

/** `[ ]` ↔ `[<]`; any other task (in progress, next, done, cancelled) becomes `[<]`, losing its done stamp. */
export function toggleSomeday(line: string): string {
	return toggleMarker(line, '<');
}

/** `[ ]` ↔ `[?]`; any other task (in progress, next, someday, idea, done, cancelled) becomes `[?]`, losing its done stamp. */
export function toggleQuestion(line: string): string {
	return toggleMarker(line, '?');
}

/** `[ ]` ↔ `[I]`; any other task (in progress, next, someday, question, done, cancelled) becomes `[I]`, losing its done stamp. */
export function toggleIdea(line: string): string {
	return toggleMarker(line, 'I');
}

const BULLET = /^(\s*[-*+] )(.*)$/;
/** Lines that are not plain text: headings, quotes, tables, code fences, rules and numbered lists. */
const NOT_PLAIN = /^(#{1,6}(\s|$)|>|\||```|~~~|---|\*\*\*|\d+[.)]\s)/;

/** A bullet or a plain text line as a `[?]` or `[I]` task, keeping its indent; null for blank lines, other blocks and any line with a `[c]` box. */
export function plainLineToTask(raw: string, marker: '?' | 'I'): string | null {
	const eol = raw.endsWith('\r') ? '\r' : '';
	const line = eol ? raw.slice(0, -1) : raw;
	if (line.trim() === '') return null;
	const bullet = BULLET.exec(line);
	if (bullet) {
		const rest = bullet[2] ?? '';
		if (/^\[.\]/.test(rest)) return null;
		return `${bullet[1] ?? ''}[${marker}] ${rest}${eol}`;
	}
	const indent = /^\s*/.exec(line)?.[0] ?? '';
	const text = line.slice(indent.length);
	if (NOT_PLAIN.test(text)) return null;
	return `${indent}- [${marker}] ${text}${eol}`;
}

/** `[-]` ↔ `[ ]`; any other task (in progress, next, someday, done) becomes `[-]`, losing its done stamp. */
export function toggleCancelled(line: string): string {
	const parts = split(line);
	if (!parts) return line;
	if (parts.stateChar === '-') return reopenTask(line);
	const body = parts.stamp ? parts.body.trimEnd() : parts.body;
	return parts.prefix + '-' + parts.suffix + body + parts.eol;
}

/** Removes the done stamp, keeping the marker as it is. Non-task lines are returned unchanged. */
export function removeDoneStamp(line: string): string {
	const parts = split(line);
	if (!parts || !parts.stamp) return line;
	return parts.prefix + parts.stateChar + parts.suffix + parts.body.trimEnd() + parts.eol;
}

function bare(tag: string): string {
	return tag.replace(/^#/, '').toLowerCase();
}

/** `#tag` as a whole tag: at the start or after whitespace, not followed by more tag characters. */
function tagPattern(tag: string): RegExp {
	const escaped = bare(tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(?:^|\\s)#${escaped}(?![\\p{L}\\p{N}_\\-/])`, 'giu');
}

/** Adds `#tag` at the end of the task text, before the schedule link. Unchanged if the task already has it. */
export function addTag(line: string, tag: string): string {
	const parts = split(line);
	if (!parts) return line;
	if (tagPattern(tag).test(parts.body)) return line;
	const head = parts.prefix + parts.stateChar + parts.suffix;
	const token = `#${tag.replace(/^#/, '')}`;
	const links = scheduleLinks(parts.body);
	const last = links[links.length - 1];
	const body = last
		? `${parts.body.slice(0, last.index).trimEnd()} ${token} ${parts.body.slice(last.index)}`.trimStart()
		: `${parts.body.trimEnd()} ${token}`.trimStart();
	return head + body + parts.stamp + parts.eol;
}

/** Removes every `#tag` in `tags` (with or without `#`, any case) from the task text. */
export function removeTags(line: string, tags: string[]): string {
	const parts = split(line);
	if (!parts) return line;
	let body = parts.body;
	// Each tag goes with the space before it, so the rest of the text keeps its spacing.
	for (const tag of tags) body = body.replace(tagPattern(tag), '');
	body = body.trim();
	return parts.prefix + parts.stateChar + parts.suffix + body + parts.stamp + parts.eol;
}

/** Adds `text` as an open task on its own line at the end or the top (after any frontmatter) of a note's content. */
export function addTaskLine(content: string, text: string, at: 'start' | 'end'): string {
	const line = [`- [ ] ${text.trim()}`];
	return at === 'start' ? prependBlock(content, line) : appendBlock(content, line);
}

/** How far a line is indented, a tab counting as four spaces. */
export function indentWidth(line: string): number {
	return (/^[ \t]*/.exec(line)?.[0] ?? '').replace(/\t/g, '    ').length;
}

/** The line after the task on `start` and its subtasks: the following lines indented further than it, up to a blank line. */
export function taskBlockEnd(lines: string[], start: number): number {
	const own = indentWidth(lines[start] ?? '');
	let end = start + 1;
	while (end < lines.length && (lines[end] as string).trim() !== '' && indentWidth(lines[end] as string) > own) end++;
	return end;
}

/** Strips the first line's indentation from every line of a block, so its top task starts at the margin. */
export function outdentBlock(block: string[]): string[] {
	const lead = /^[ \t]*/.exec(block[0] ?? '')?.[0] ?? '';
	return block.map((line) => (line.startsWith(lead) ? line.slice(lead.length) : line));
}

/** Appends `block` as lines of their own at the end of a note's content. */
export function appendBlock(content: string, block: string[]): string {
	const sep = content === '' || content.endsWith('\n') ? '' : '\n';
	return `${content}${sep}${block.join('\n')}\n`;
}

/** Puts `block` as lines of their own at the start of a note's content, after its frontmatter if it has one. */
export function prependBlock(content: string, block: string[]): string {
	const frontmatter = /^---\n[\s\S]*?\n---(?:\n|$)/.exec(content)?.[0] ?? '';
	const head = frontmatter === '' || frontmatter.endsWith('\n') ? frontmatter : `${frontmatter}\n`;
	return `${head}${block.join('\n')}\n${content.slice(frontmatter.length)}`;
}

const DONE_HEADING = /^##\s+done\s*$/i;
const SECTION_END = /^#{1,2}\s/;
const FENCE = /^\s*(`{3,}|~{3,})(.*)$/;

/**
 * The code fence open after `line`, given the one open before it (null outside a code block). A fence closes only on
 * the same character, at least as long, with nothing after it; a backtick line with another backtick after the fence
 * is inline code, not a fence.
 */
export function fenceAfter(open: string | null, line: string): string | null {
	const m = FENCE.exec(line.replace(/\r$/, ''));
	if (!m) return open;
	const fence = m[1] as string;
	const rest = m[2] as string;
	if (open !== null) return fence[0] === open[0] && fence.length >= open.length && rest.trim() === '' ? null : open;
	return fence[0] === '`' && rest.includes('`') ? null : fence;
}

/**
 * Moves every done top-level task, with its subtasks, to the end of the note's `## Done` section, adding the section at
 * the end of the note when there is none. Nested done tasks, tasks already under `## Done` and tasks in code blocks
 * stay where they are. Null when there is nothing to move.
 */
export function moveDoneToSection(lines: string[], markers: MarkerSettings = ALL_MARKERS): string[] | null {
	const kept: string[] = [];
	const moved: string[] = [];
	let doneAt = -1;
	let inDone = false;
	let fence: string | null = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] as string;
		if (fence === null && SECTION_END.test(line)) {
			inDone = doneAt === -1 && DONE_HEADING.test(line);
			if (inDone) doneAt = kept.length;
		} else if (fence === null && !inDone && indentWidth(line) === 0 && parseTaskLine(line, markers)?.checked) {
			const end = taskBlockEnd(lines, i);
			const block = lines.slice(i, end);
			// A block that leaves a code block open (a blank line inside a subtask's code) stays, so the code isn't split.
			if (block.reduce(fenceAfter, null) === null) {
				moved.push(...block);
				i = end - 1;
				continue;
			}
		}
		fence = fenceAfter(fence, line);
		kept.push(line);
	}
	if (moved.length === 0) return null;

	if (doneAt === -1) {
		const trailing = kept[kept.length - 1] === '' ? [''] : [];
		while (kept.length > 0 && (kept[kept.length - 1] as string).trim() === '') kept.pop();
		return [...kept, ...(kept.length > 0 ? [''] : []), '## Done', ...moved, ...trailing];
	}
	let sectionEnd = doneAt + 1;
	while (sectionEnd < kept.length && !SECTION_END.test(kept[sectionEnd] as string)) sectionEnd++;
	let insertAt = sectionEnd;
	while (insertAt > doneAt + 1 && (kept[insertAt - 1] as string).trim() === '') insertAt--;
	return [...kept.slice(0, insertAt), ...moved, ...kept.slice(insertAt)];
}
