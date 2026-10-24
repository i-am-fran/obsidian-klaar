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
}

export const ALL_MARKERS: MarkerSettings = { next: true, someday: true };

/** The marker settings out of the plugin settings. */
export function markersOf(settings: { nextMarker: boolean; somedayMarker: boolean }): MarkerSettings {
	return { next: settings.nextMarker, someday: settings.somedayMarker };
}

/** The only markers Klaar treats as tasks; any other (`[!]`, `[?]`...) is left alone, like a plain bullet. */
const MARKER = /^(\s*[-*+] \[)([ xX\-/<>])(\] )/;
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
	return true;
}

/** Null for a line that is not a task, including one whose `[>]` or `[<]` marker is switched off in `markers`. */
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
		text: text.replace(/\s+/g, ' ').trim(),
		scheduleKey: link ? link.key : null,
		doneDate: parts.doneDate,
	};
}

/** The character between the brackets (`' '`, `x`, `X`, `-`, `/`, `>`, `<`), or null for a line that is not a task. */
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

/** Markers of a task that is not finished: to do, in progress, next and someday. */
export type OpenMarker = ' ' | '/' | '>' | '<';

function isOpenChar(c: string): c is OpenMarker {
	return c === ' ' || c === '/' || c === '>' || c === '<';
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

/** Unticks a done, cancelled or someday task, dropping the done stamp; open tasks (`[ ]`, `[/]`, `[>]`) and non-task lines are returned unchanged. */
export function reopenTask(line: string): string {
	const parts = split(line);
	if (!parts || parts.stateChar === ' ' || parts.stateChar === '/' || parts.stateChar === '>') return line;
	return parts.prefix + ' ' + parts.suffix + parts.body.trimEnd() + parts.eol;
}

/** `[ ]` when the task already has `marker`, otherwise `marker`, reopening a done or cancelled task first. */
function toggleMarker(line: string, marker: '>' | '<'): string {
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

/** Appends `text` as an open task on its own line at the end of a note's content. */
export function appendTaskLine(content: string, text: string): string {
	const sep = content === '' || content.endsWith('\n') ? '' : '\n';
	return `${content}${sep}- [ ] ${text.trim()}\n`;
}

/** How far a line is indented, a tab counting as four spaces. */
function indentWidth(line: string): number {
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
