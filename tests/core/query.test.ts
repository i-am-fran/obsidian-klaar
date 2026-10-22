import { describe, expect, test } from 'vitest';
import { ALL_PERIODS, parsePeriodKey } from '../../src/core/periods';
import type { Period } from '../../src/core/periods';
import { matchesMarker, scheduleStatus, scheduledFor, sortByMarkers, splitDone } from '../../src/core/query';
import type { MarkerFilter } from '../../src/core/query';
import type { TaskRef } from '../../src/core/tasks';

function task(text: string, scheduleKey: string | null, extra: Partial<TaskRef> = {}): TaskRef {
	return { path: 'Other.md', line: 0, raw: `- [ ] ${text}`, checked: false, cancelled: false, someday: false, next: false, text, scheduleKey, explicit: true, doneDate: null, inProgress: false, priority: 0, status: null, tags: [], heading: null, subtask: false, ...extra };
}

const day19 = task('day19', '2026-10-19');
const day22 = task('day22', '2026-10-22');
const w43 = task('w43', '2026-W43');
const w44 = task('w44', '2026-W44');
const oct = task('oct', '2026-10');
const done = task('done', '2026-10-19', { checked: true, doneDate: '2026-10-19' });
const undated = task('undated', null);
const cancelled = task('cancelled', '2026-10-19', { cancelled: true });
const cancelledUndated = task('cancelledUndated', null, { cancelled: true });
const own = task('own', '2026-10-19', { path: 'Notes/2026-W43.md' });
const all = [day19, day22, w43, w44, oct, done, undated, own, cancelled, cancelledUndated];

function p(key: string): Period {
	const period = parsePeriodKey(key);
	if (!period) throw new Error(key);
	return period;
}

const texts = (groups: ReturnType<typeof scheduledFor>) => groups.map(g => [g.label, g.tasks.map(t => t.text)]);

describe('scheduledFor', () => {
	test('a day keeps its completed tasks listed, but not cancelled ones or other kinds of group', () => {
		const g = scheduledFor([done, cancelled, day19], p('2026-10-19'), '2026-10-30', 'Notes/2026-10-19.md');
		expect(texts(g)).toEqual([['Scheduled', ['done', 'day19']]]);
		expect(texts(scheduledFor([done], p('2026-W43'), '2026-10-30', 'x.md'))).toEqual([]);
		const weekDone = task('weekDone', '2026-W43', { checked: true });
		expect(texts(scheduledFor([weekDone, w43], p('2026-W43'), '2026-10-30', 'x.md'))).toEqual([['Scheduled', ['w43']]]);
	});
	test('week: own schedule first, then days; skips checked and own-path tasks', () => {
		const g = scheduledFor(all, p('2026-W43'), '2026-10-01', 'Notes/2026-W43.md');
		expect(texts(g)).toEqual([['Scheduled', ['w43']], ['Scheduled this month', ['oct']], ['2026-10-19', ['day19']], ['2026-10-22', ['day22']]]);
		expect(g[0]?.key).toBe('2026-W43');
	});
	test('month: groups by week', () => {
		const g = scheduledFor(all, p('2026-10'), '2026-10-01', 'Notes/2026-10.md');
		expect(texts(g)).toEqual([
			['Scheduled', ['oct']],
			['2026-W43', ['day19', 'day22', 'w43', 'own']],
			['2026-W44', ['w44']],
		]);
	});
	test('day: tasks scheduled to its week come after its own, labelled for the week', () => {
		const sat = task('sat', '2026-10-24');
		const g = scheduledFor([...all, sat], p('2026-10-22'), '2026-10-01', 'Notes/2026-10-22.md');
		expect(texts(g)).toEqual([['Scheduled', ['day22']], ['Scheduled this week', ['w43']]]);
		expect(g[1]?.key).toBe('2026-W43');
	});
	test('day: a week task shows on every day of that week, not on the next', () => {
		expect(scheduledFor(all, p('2026-10-19'), '2026-10-01', 'x.md').map(x => x.label)).toContain('Scheduled this week');
		expect(scheduledFor(all, p('2026-10-25'), '2026-10-01', 'x.md').map(x => x.label)).toContain('Scheduled this week');
		expect(texts(scheduledFor(all, p('2026-10-26'), '2026-10-01', 'x.md'))).toEqual([['Scheduled this week', ['w44']]]);
	});
	test('day: the week group skips tasks living in the day note itself', () => {
		const inNote = task('inNote', '2026-W43', { path: 'Notes/2026-10-20.md' });
		expect(scheduledFor([inNote], p('2026-10-20'), '2026-10-01', 'Notes/2026-10-20.md')).toEqual([]);
	});
	test('week: tasks scheduled to its month (by Thursday) come after its own', () => {
		const nov = task('nov', '2026-11');
		// W44 runs 26 Oct - 1 Nov; its Thursday is 29 Oct, so it belongs to October.
		const g = scheduledFor([...all, nov], p('2026-W44'), '2026-10-01', 'x.md');
		expect(texts(g)).toEqual([['Scheduled', ['w44']], ['Scheduled this month', ['oct']]]);
		expect(g[1]?.key).toBe('2026-10');
	});
	test('month: parent is the quarter when enabled, the year when not', () => {
		const q4 = task('q4', '2026-Q4');
		const y = task('y', '2026');
		const on = scheduledFor([q4, y], p('2026-10'), '2026-10-01', 'x.md');
		expect(texts(on)).toEqual([['Scheduled this quarter', ['q4']]]);
		const off = scheduledFor([q4, y], p('2026-10'), '2026-10-01', 'x.md', { ...ALL_PERIODS, quarter: false });
		expect(texts(off)).toEqual([['Scheduled this year', ['y']]]);
	});
	test('year: no parent; with quarters off, rollup by month and a leftover quarter task gets its own group', () => {
		const q4 = task('q4', '2026-Q4');
		const g = scheduledFor([oct, q4, day22], p('2026'), '2026-01-01', 'x.md', { ...ALL_PERIODS, quarter: false });
		expect(texts(g)).toEqual([['2026-10', ['oct', 'day22']], ['2026-Q4', ['q4']]]);
	});
	test('day: with weeks off, parent is the month', () => {
		const g = scheduledFor(all, p('2026-10-20'), '2026-10-01', 'x.md', { ...ALL_PERIODS, week: false });
		expect(texts(g)).toEqual([['Scheduled this month', ['oct']]]);
	});
	test('today day note gets Overdue with ended periods only', () => {
		const g = scheduledFor(all, p('2026-10-21'), '2026-10-21', 'Notes/2026-10-21.md');
		expect(texts(g)).toEqual([['Scheduled this week', ['w43']], ['Overdue', ['day19', 'own']]]);
		expect(g[1]?.key).toBeNull();
	});
	test('no Overdue on a non-today day', () => {
		expect(scheduledFor(all, p('2026-10-20'), '2026-10-21', 'x.md').map(x => x.label)).toEqual(['Scheduled this week']);
	});
	test('no Overdue on a non-day period', () => {
		const g = scheduledFor(all, p('2026-W44'), '2026-10-26', 'x.md');
		expect(g.map(x => x.label)).toEqual(['Scheduled', 'Scheduled this month']);
	});
	test('week-in-quarter grouped by month via Thursday', () => {
		const g = scheduledFor([task('a', '2026-W44'), task('b', '2026-W40')], p('2026-Q4'), '2026-01-01', 'x.md');
		expect(g.map(x => x.label)).toEqual(['2026-10']);
	});
});

describe('scheduleStatus', () => {
	test('open when an open task is scheduled to that exact period', () => {
		expect(scheduleStatus(all, '2026-10-19')).toBe('open');
		expect(scheduleStatus(all, '2026-W43')).toBe('open');
	});
	test('open wins over done on the same period', () => {
		expect(scheduleStatus([done, day19], '2026-10-19')).toBe('open');
	});
	test('done when every task on the period is checked', () => {
		expect(scheduleStatus([done], '2026-10-19')).toBe('done');
		expect(scheduleStatus([done, cancelled], '2026-10-19')).toBe('done');
	});
	test('null for no tasks, only cancelled tasks, or rollups from other periods', () => {
		expect(scheduleStatus(all, '2026-10-20')).toBeNull();
		expect(scheduleStatus([cancelled], '2026-10-19')).toBeNull();
		expect(scheduleStatus([w43], '2026-10-19')).toBeNull();
	});
});

describe('matchesMarker', () => {
	const plain = task('plain', null);
	const going = task('going', null, { inProgress: true });
	const urgent = task('urgent', null, { priority: 3 });
	const both = task('both', null, { inProgress: true, priority: 1 });
	const marked = [plain, going, urgent, both];
	const run = (m: MarkerFilter) => marked.filter(t => matchesMarker(t, m)).map(t => t.text);
	test('any', () => expect(run('any')).toEqual(['plain', 'going', 'urgent', 'both']));
	test('in-progress', () => expect(run('in-progress')).toEqual(['going', 'both']));
	test('priority', () => expect(run('priority')).toEqual(['urgent', 'both']));
});

describe('sortByMarkers', () => {
	test('!!! then !! then ! then in progress then the rest, stable within each', () => {
		const tasks = [
			task('a', null),
			task('going', null, { inProgress: true }),
			task('one', null, { priority: 1 }),
			task('b', null),
			task('three', null, { priority: 3 }),
			task('twoGoing', null, { priority: 2, inProgress: true }),
			task('two', null, { priority: 2 }),
		];
		expect(sortByMarkers(tasks).map(t => t.text)).toEqual(['three', 'twoGoing', 'two', 'one', 'going', 'a', 'b']);
		expect(tasks[0]?.text).toBe('a');
	});
});

describe('next and someday', () => {
	const next = task('next', '2026-10-19', { next: true });
	const someday = task('someday', '2026-10-19', { someday: true });
	const somedayOld = task('somedayOld', '2026-10-01', { someday: true });
	test('next shows like an open task; someday stays out of every group', () => {
		expect(texts(scheduledFor([next, someday, somedayOld], p('2026-10-19'), '2026-10-19', 'Notes/2026-10-19.md'))).toEqual([['Scheduled', ['next']]]);
		expect(texts(scheduledFor([someday], p('2026-W43'), '2026-10-19', 'Notes/2026-W43.md'))).toEqual([]);
	});
	test('someday is never overdue', () => {
		expect(texts(scheduledFor([somedayOld], p('2026-10-19'), '2026-10-19', 'Notes/2026-10-19.md'))).toEqual([]);
	});
	test('the calendar ignores someday tasks', () => {
		expect(scheduleStatus([someday], '2026-10-19')).toBeNull();
		expect(scheduleStatus([someday, next], '2026-10-19')).toBe('open');
	});
	test('marker filter and rank', () => {
		expect(matchesMarker(next, 'next')).toBe(true);
		expect(matchesMarker(day19, 'next')).toBe(false);
		expect(sortByMarkers([day19, next]).map(t => t.text)).toEqual(['next', 'day19']);
	});
});

describe('splitDone', () => {
	test('splits open and ticked tasks, keeping order', () => {
		const a = task('a', null), b = task('b', null, { checked: true }), c = task('c', null), d = task('d', null, { checked: true });
		const { open, done } = splitDone([a, b, c, d]);
		expect(open.map(t => t.text)).toEqual(['a', 'c']);
		expect(done.map(t => t.text)).toEqual(['b', 'd']);
	});
	test('no done tasks gives an empty done list', () => expect(splitDone([task('a', null)]).done).toEqual([]));
	test("a day's own group keeps its done tasks for the Done group", () => {
		const groups = scheduledFor([task('open', '2026-10-19'), task('ticked', '2026-10-19', { checked: true })], parsePeriodKey('2026-10-19') as Period, '2026-10-19', 'Daily/2026-10-19.md');
		const own = groups.find(g => g.label === 'Scheduled');
		expect(splitDone(own?.tasks ?? []).done.map(t => t.text)).toEqual(['ticked']);
	});
});
