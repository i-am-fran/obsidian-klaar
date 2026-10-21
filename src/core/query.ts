import { addDays } from './dates';
import type { IsoDate } from './dates';
import { ALL_PERIODS, PERIOD_ORDER, childKindIn, contains, parentKind, parsePeriodKey, periodOf } from './periods';
import type { EnabledPeriods, Period } from './periods';
import type { TaskRef } from './tasks';

export interface TaskGroup {
	label: string;
	key: string | null;
	tasks: TaskRef[];
}

export type MarkerFilter = 'any' | 'in-progress' | 'next' | 'priority';

export function taskPeriod(t: TaskRef): Period | null {
	return t.scheduleKey === null ? null : parsePeriodKey(t.scheduleKey);
}

/** The period of `kind` that a task period falls in (a week is placed by its Thursday). */
function enclosing(kind: Period['kind'], inner: Period): Period {
	return periodOf(kind, inner.kind === 'week' ? addDays(inner.start, 3) : inner.start);
}

/** Neither checked, cancelled nor parked for someday. */
export function isOpen(t: TaskRef): boolean {
	return !t.checked && !t.cancelled && !t.someday;
}

export function isOverdue(t: TaskRef, today: IsoDate): boolean {
	const p = taskPeriod(t);
	return isOpen(t) && p !== null && p.end < today;
}

/**
 * Tasks from other notes that belong under `period`'s note: its own (a day also lists done ones), its
 * parent period's (the next enabled kind up), its children grouped by the next
 * enabled kind down, and (on today's note) overdue; all but a day's own are open only.
 */
export function scheduledFor(all: TaskRef[], period: Period, today: IsoDate, notePath: string, enabled: EnabledPeriods = ALL_PERIODS): TaskGroup[] {
	const open = all.filter(t => isOpen(t) && t.path !== notePath);
	const groups: TaskGroup[] = [];

	// A day keeps its completed tasks listed so a finished day can be looked back on; wider periods and the other groups are open work only.
	const own = (period.kind === 'day' ? all.filter(t => !t.cancelled && !t.someday) : open).filter(t => t.scheduleKey === period.key && t.path !== notePath);
	if (own.length > 0) groups.push({ label: 'Scheduled', key: period.key, tasks: own });

	const parent = parentKind(period.kind, enabled);
	if (parent !== null) {
		const parentPeriod = enclosing(parent, period);
		const inParent = open.filter(t => t.scheduleKey === parentPeriod.key);
		if (inParent.length > 0) groups.push({ label: `Scheduled this ${parent}`, key: parentPeriod.key, tasks: inParent });
	}

	const child = childKindIn(period.kind, enabled);
	if (child !== null) {
		const byChild = new Map<string, { start: IsoDate; tasks: TaskRef[] }>();
		for (const t of open) {
			const p = taskPeriod(t);
			if (!p || p.key === period.key || !contains(period, p)) continue;
			// A task on a kind coarser than the child (e.g. a quarter when grouping by month) keeps its own group.
			const c = PERIOD_ORDER.indexOf(p.kind) > PERIOD_ORDER.indexOf(child) ? p : enclosing(child, p);
			const entry = byChild.get(c.key) ?? { start: c.start, tasks: [] };
			entry.tasks.push(t);
			byChild.set(c.key, entry);
		}
		[...byChild.entries()]
			.sort((a, b) => (a[1].start < b[1].start ? -1 : a[1].start > b[1].start ? 1 : 0))
			.forEach(([key, entry]) => groups.push({ label: key, key, tasks: entry.tasks }));
	}

	if (period.kind === 'day' && period.key === today) {
		const overdue = open.filter(t => isOverdue(t, today));
		if (overdue.length > 0) groups.push({ label: 'Overdue', key: null, tasks: overdue });
	}
	return groups;
}

export function matchesMarker(t: TaskRef, m: MarkerFilter): boolean {
	switch (m) {
		case 'any':
			return true;
		case 'in-progress':
			return t.inProgress;
		case 'next':
			return t.next;
		case 'priority':
			return t.priority > 0;
	}
}

/** Higher number sorts first: high (4), medium (3), low (2) priority, in progress or next (1), the rest (0). */
export function markerRank(t: TaskRef): number {
	if (t.priority > 0) return t.priority + 1;
	return t.inProgress || t.next ? 1 : 0;
}

/** A copy sorted high priority first, then medium, low, in progress or next, the rest; ties keep their order. */
export function sortByMarkers(tasks: TaskRef[]): TaskRef[] {
	return [...tasks].sort((a, b) => markerRank(b) - markerRank(a));
}

/** What the calendar shows for a period: open tasks win over done ones; cancelled and someday tasks don't count. Rollups from other periods are ignored. */
export function scheduleStatus(all: TaskRef[], key: string): 'open' | 'done' | null {
	let status: 'open' | 'done' | null = null;
	for (const t of all) {
		if (t.scheduleKey !== key || t.cancelled || t.someday) continue;
		if (!t.checked) return 'open';
		status = 'done';
	}
	return status;
}

/** Groups tasks by schedule key, oldest period first; tasks without a (valid) schedule go in a last "Undated" group. */
export function groupByDate(tasks: TaskRef[]): TaskGroup[] {
	const dated = new Map<string, { start: IsoDate; tasks: TaskRef[] }>();
	const undated: TaskRef[] = [];
	for (const t of tasks) {
		const p = taskPeriod(t);
		if (!p) {
			undated.push(t);
			continue;
		}
		const entry = dated.get(p.key) ?? { start: p.start, tasks: [] };
		entry.tasks.push(t);
		dated.set(p.key, entry);
	}
	const groups: TaskGroup[] = [...dated.entries()]
		.sort((a, b) => (a[1].start < b[1].start ? -1 : a[1].start > b[1].start ? 1 : a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
		.map(([key, entry]) => ({ label: key, key, tasks: entry.tasks }));
	if (undated.length > 0) groups.push({ label: 'Undated', key: null, tasks: undated });
	return groups;
}
