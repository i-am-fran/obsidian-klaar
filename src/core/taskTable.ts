import type { IsoDate } from './dates';
import { contains, periodOf } from './periods';
import { groupByDate, isOpen, isOverdue, markerRank, matchesMarker, taskPeriod } from './query';
import type { MarkerFilter, TaskGroup } from './query';
import type { TaskRef } from './tasks';

export type StatusFilter = 'open' | 'done' | 'someday' | 'cancelled' | 'all';
export type WhenFilter = 'any' | 'overdue' | 'today' | 'this-week' | 'undated';
export type SortKey = 'date' | 'priority' | 'note' | 'task';
export type GroupKey = 'date' | 'note' | 'priority' | 'tag' | 'none';

/** What the Tasks view toolbar shows, saved per view. The search text is not part of it. */
export interface TableState {
	status: StatusFilter;
	when: WhenFilter;
	marker: MarkerFilter;
	sort: SortKey;
	reverse: boolean;
	group: GroupKey;
	/** Tasks nested under another task; off hides them. */
	subtasks: boolean;
	/** `any`, or a `#tag`: only tasks with that tag or one nested under it. */
	tag: string;
}

export const DEFAULT_TABLE_STATE: TableState = { status: 'open', when: 'any', marker: 'any', sort: 'date', reverse: false, group: 'date', subtasks: true, tag: 'any' };

/** Config keys the view saves under; prefixed so they never clash with Bases' own keys (`sort`, `groupBy`, `filters`...). */
export const TABLE_KEYS = { status: 'klaarStatus', when: 'klaarWhen', marker: 'klaarMarker', sort: 'klaarSort', reverse: 'klaarReverse', group: 'klaarGroup', subtasks: 'klaarSubtasks', tag: 'klaarTag' } as const;

/** Saved toggle for the toolbar above the table; on unless saved as `false`. */
export const TOOLBAR_KEY = 'klaarToolbar';

/** Table columns the user can switch on from the view's menu; Task, Date and Note always show. */
export type OptionalColumn = 'status' | 'priority' | 'tags' | 'heading';

export const COLUMN_KEYS: Record<OptionalColumn, string> = { status: 'klaarColStatus', priority: 'klaarColPriority', tags: 'klaarColTags', heading: 'klaarColHeading' };

/** Which optional columns are on; anything not saved as `true` is off. */
export function readColumns(get: (key: string) => unknown): Record<OptionalColumn, boolean> {
	const on = (c: OptionalColumn) => get(COLUMN_KEYS[c]) === true;
	return { status: on('status'), priority: on('priority'), tags: on('tags'), heading: on('heading') };
}

const STATUSES: StatusFilter[] = ['open', 'done', 'someday', 'cancelled', 'all'];
const WHENS: WhenFilter[] = ['any', 'overdue', 'today', 'this-week', 'undated'];
const MARKERS: MarkerFilter[] = ['any', 'in-progress', 'next', 'priority'];
const SORTS: SortKey[] = ['date', 'priority', 'note', 'task'];
const GROUPS: GroupKey[] = ['date', 'note', 'priority', 'tag', 'none'];

function pick<T extends string>(value: unknown, allowed: T[]): T | undefined {
	return allowed.find(a => a === value);
}

/** Reads saved toolbar choices. A view saved before the toolbar has `filter` instead of `status`/`when`. */
export function readTableState(get: (key: string) => unknown): TableState {
	const d = DEFAULT_TABLE_STATE;
	let status = pick(get(TABLE_KEYS.status), STATUSES);
	let when = pick(get(TABLE_KEYS.when), WHENS);
	if (status === undefined && when === undefined) {
		const old = get('filter');
		if (old === 'done' || old === 'all') status = old;
		else when = pick(old, WHENS);
	}
	const reverse = get(TABLE_KEYS.reverse);
	const subtasks = get(TABLE_KEYS.subtasks);
	const tag = get(TABLE_KEYS.tag);
	return {
		status: status ?? d.status,
		when: when ?? d.when,
		marker: pick(get(TABLE_KEYS.marker), MARKERS) ?? pick(get('marker'), MARKERS) ?? d.marker,
		sort: pick(get(TABLE_KEYS.sort), SORTS) ?? d.sort,
		reverse: typeof reverse === 'boolean' ? reverse : d.reverse,
		group: pick(get(TABLE_KEYS.group), GROUPS) ?? d.group,
		subtasks: typeof subtasks === 'boolean' ? subtasks : d.subtasks,
		tag: typeof tag === 'string' && tag.startsWith('#') ? tag : d.tag,
	};
}

/**
 * For a view saved before the toolbar: its old `filter`/`marker` choices under the new keys, so the view's menu
 * (which only reads the new keys) shows the same as the toolbar. Empty when there is nothing to move.
 */
export function legacyKeysToSave(get: (key: string) => unknown): Record<string, string> {
	const s = readTableState(get);
	const out: Record<string, string> = {};
	// The old `filter` became status + when; the old `marker` moves on its own, as readTableState reads it.
	if (get('filter') !== undefined && get(TABLE_KEYS.status) === undefined && get(TABLE_KEYS.when) === undefined) {
		out[TABLE_KEYS.status] = s.status;
		out[TABLE_KEYS.when] = s.when;
	}
	if (get('marker') !== undefined && get(TABLE_KEYS.marker) === undefined) out[TABLE_KEYS.marker] = s.marker;
	return out;
}

export function matchesStatus(t: TaskRef, s: StatusFilter): boolean {
	switch (s) {
		case 'open':
			return isOpen(t);
		case 'done':
			return t.checked;
		case 'someday':
			return t.someday;
		case 'cancelled':
			return t.cancelled;
		case 'all':
			return true;
	}
}

/** Date filters look at the date only, except Overdue, which only open tasks can be. */
export function matchesWhen(t: TaskRef, w: WhenFilter, today: IsoDate): boolean {
	switch (w) {
		case 'any':
			return true;
		case 'undated':
			return t.scheduleKey === null;
		case 'today':
			return t.scheduleKey === today;
		case 'overdue':
			return isOverdue(t, today);
		case 'this-week': {
			const p = taskPeriod(t);
			if (!p) return false;
			const week = periodOf('week', today);
			return p.key === week.key || contains(week, p);
		}
	}
}

/** The task has `tag` (`#tag`) or a tag nested under it, ignoring case; `any` matches every task. */
export function matchesTag(t: TaskRef, tag: string): boolean {
	if (tag === 'any') return true;
	const want = tag.toLowerCase();
	return t.tags.some(own => {
		const lower = own.toLowerCase();
		return lower === want || lower.startsWith(`${want}/`);
	});
}

/** Every tag on the tasks plus the parents of nested ones, for the Tag filter: once each ignoring case (first spelling wins), sorted. */
export function taskTags(tasks: TaskRef[]): string[] {
	const byLower = new Map<string, string>();
	for (const t of tasks) {
		for (const tag of t.tags) {
			const parts = tag.split('/');
			for (let i = 1; i <= parts.length; i++) {
				const name = parts.slice(0, i).join('/');
				if (!byLower.has(name.toLowerCase())) byLower.set(name.toLowerCase(), name);
			}
		}
	}
	return [...byLower.values()].sort(compareText);
}

/** Case-insensitive substring match on the task text (markers excluded), its tags and the note name. */
export function matchesSearch(t: TaskRef, query: string, noteName: string): boolean {
	const q = query.trim().toLowerCase();
	if (q === '') return true;
	return [t.text, ...t.tags, noteName].some(s => s.toLowerCase().includes(q));
}

export function filterTasks(tasks: TaskRef[], state: TableState, query: string, today: IsoDate, noteName: (path: string) => string): TaskRef[] {
	return tasks.filter(t =>
		(state.subtasks || !t.subtask) &&
		matchesStatus(t, state.status) &&
		matchesWhen(t, state.when, today) &&
		matchesMarker(t, state.marker) &&
		matchesTag(t, state.tag) &&
		matchesSearch(t, query, noteName(t.path)));
}

type Compare = (a: TaskRef, b: TaskRef) => number;

function compareText(a: string, b: string): number {
	return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/** Dated tasks by period start (then key); 0 when either is undated. */
function compareDated(a: TaskRef, b: TaskRef): number {
	const pa = taskPeriod(a);
	const pb = taskPeriod(b);
	if (!pa || !pb) return 0;
	if (pa.start !== pb.start) return pa.start < pb.start ? -1 : 1;
	return pa.key < pb.key ? -1 : pa.key > pb.key ? 1 : 0;
}

/** Undated after dated, whatever the direction. */
function undatedLast(a: TaskRef, b: TaskRef): number {
	return Number(taskPeriod(a) === null) - Number(taskPeriod(b) === null);
}

/** The default order: oldest date first, then high, medium, low priority, in progress, the rest. */
const byDefault: Compare = (a, b) => undatedLast(a, b) || compareDated(a, b) || markerRank(b) - markerRank(a);

/** A sorted copy. `reverse` flips the chosen key only; ties fall back to the default order. */
export function sortTasks(tasks: TaskRef[], sort: SortKey, reverse: boolean, noteName: (path: string) => string): TaskRef[] {
	const dir = reverse ? -1 : 1;
	const primary: Record<SortKey, Compare> = {
		date: (a, b) => undatedLast(a, b) || dir * compareDated(a, b),
		priority: (a, b) => dir * (markerRank(b) - markerRank(a)),
		note: (a, b) => dir * compareText(noteName(a.path), noteName(b.path)),
		task: (a, b) => dir * compareText(a.text, b.text),
	};
	return [...tasks].sort((a, b) => primary[sort](a, b) || byDefault(a, b));
}

const PRIORITY_LABELS = ['No priority', 'Low', 'Medium', 'High'];

/** Sorted rows split into groups. Groups keep their natural order unless the group key is also the sort key. */
export function groupTasks(tasks: TaskRef[], state: TableState, noteName: (path: string) => string): TaskGroup[] {
	const sorted = sortTasks(tasks, state.sort, state.reverse, noteName);
	return groupSorted(sorted, state.group, state.reverse && state.sort === state.group, noteName);
}

/** Already sorted tasks split into groups, keeping their order inside each; `flip` reverses the groups' natural order. */
export function groupSorted(sorted: TaskRef[], group: GroupKey, flip: boolean, noteName: (path: string) => string): TaskGroup[] {
	switch (group) {
		case 'none':
			return sorted.length > 0 ? [{ label: '', key: null, tasks: sorted }] : [];
		case 'date': {
			const groups = groupByDate(sorted);
			if (!flip) return groups;
			const undated = groups.filter(g => g.key === null);
			return [...groups.filter(g => g.key !== null).reverse(), ...undated];
		}
		case 'note': {
			const byNote = new Map<string, TaskRef[]>();
			for (const t of sorted) {
				const name = noteName(t.path);
				byNote.set(name, [...(byNote.get(name) ?? []), t]);
			}
			const groups = [...byNote.entries()]
				.sort((a, b) => compareText(a[0], b[0]))
				.map(([label, ts]): TaskGroup => ({ label, key: null, tasks: ts }));
			return flip ? groups.reverse() : groups;
		}
		case 'priority': {
			const marked = [3, 2, 1]
				.map((p): TaskGroup => ({ label: PRIORITY_LABELS[p] ?? '', key: null, tasks: sorted.filter(t => t.priority === p) }))
				.filter(g => g.tasks.length > 0);
			const rest = sorted.filter(t => t.priority === 0);
			const unmarked: TaskGroup[] = rest.length > 0 ? [{ label: 'No priority', key: null, tasks: rest }] : [];
			return [...(flip ? marked.reverse() : marked), ...unmarked];
		}
		case 'tag': {
			// A task with several tags shows under each; tags that differ only in case share a group.
			const byTag = new Map<string, TaskGroup>();
			const untagged: TaskRef[] = [];
			for (const t of sorted) {
				if (t.tags.length === 0) untagged.push(t);
				for (const tag of t.tags) {
					const group = byTag.get(tag.toLowerCase()) ?? { label: tag.toLowerCase(), key: null, tasks: [] };
					group.tasks.push(t);
					byTag.set(tag.toLowerCase(), group);
				}
			}
			const groups = [...byTag.values()].sort((a, b) => compareText(a.label, b.label));
			return untagged.length > 0 ? [...groups, { label: 'No tag', key: null, tasks: untagged }] : groups;
		}
	}
}
