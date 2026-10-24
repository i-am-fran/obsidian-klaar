import { describe, expect, test } from 'vitest';
import { DEFAULT_TABLE_STATE, filterTasks, groupTasks, legacyKeysToSave, matchesSearch, matchesStatus, matchesTag, matchesWhen, readColumns, readTableState, sortTasks, taskTags } from '../../src/core/taskTable';
import type { StatusFilter, TableState, WhenFilter } from '../../src/core/taskTable';
import type { TaskRef } from '../../src/core/tasks';

function task(text: string, scheduleKey: string | null, extra: Partial<TaskRef> = {}): TaskRef {
	return { path: 'Other.md', line: 0, raw: `- [ ] ${text}`, checked: false, cancelled: false, someday: false, next: false, text, scheduleKey, explicit: true, doneDate: null, inProgress: false, priority: 0, tags: [], heading: null, subtask: false, ...extra };
}

const today = '2026-10-21';
const open = task('open', '2026-10-21');
const done = task('done', '2026-10-21', { checked: true });
const cancelled = task('cancelled', '2026-10-21', { cancelled: true });

describe('matchesStatus', () => {
	const run = (s: StatusFilter) => [open, done, cancelled].filter(t => matchesStatus(t, s)).map(t => t.text);
	test('open excludes done and cancelled', () => expect(run('open')).toEqual(['open']));
	test('done is checked only', () => expect(run('done')).toEqual(['done']));
	test('cancelled is cancelled only', () => expect(run('cancelled')).toEqual(['cancelled']));
	test('all keeps everything', () => expect(run('all')).toEqual(['open', 'done', 'cancelled']));
	test('someday is its own status, out of open', () => {
		const someday = task('someday', null, { someday: true });
		const next = task('next', null, { next: true });
		expect([someday, next].filter(t => matchesStatus(t, 'open')).map(t => t.text)).toEqual(['next']);
		expect([someday, next].filter(t => matchesStatus(t, 'someday')).map(t => t.text)).toEqual(['someday']);
	});
});

describe('matchesWhen', () => {
	const w = (t: TaskRef, f: WhenFilter) => matchesWhen(t, f, today);
	test('today matches whatever the status', () => {
		expect(w(open, 'today')).toBe(true);
		expect(w(done, 'today')).toBe(true);
		expect(w(task('t', '2026-10-22'), 'today')).toBe(false);
	});
	test('this week covers days and the week key, not the next week', () => {
		expect(w(task('t', '2026-10-22'), 'this-week')).toBe(true);
		expect(w(task('t', '2026-W43'), 'this-week')).toBe(true);
		expect(w(task('t', '2026-W44'), 'this-week')).toBe(false);
	});
	test('undated', () => {
		expect(w(task('t', null), 'undated')).toBe(true);
		expect(w(open, 'undated')).toBe(false);
	});
	test('overdue is open only', () => {
		expect(w(task('t', '2026-10-19'), 'overdue')).toBe(true);
		expect(w(task('t', '2026-10-19', { checked: true }), 'overdue')).toBe(false);
	});
	test('any matches everything', () => {
		expect(w(task('t', null), 'any')).toBe(true);
		expect(w(done, 'any')).toBe(true);
	});
});

describe('readTableState', () => {
	const read = (cfg: Record<string, unknown>) => readTableState(k => cfg[k]);
	test('nothing saved gives the defaults', () => {
		expect(read({})).toEqual(DEFAULT_TABLE_STATE);
		expect(DEFAULT_TABLE_STATE).toEqual({ status: 'open', when: 'any', marker: 'any', sort: 'date', reverse: false, group: 'date', subtasks: true, tag: 'any' });
	});
	test('old date filter becomes Open + When; marker is read as-is', () => {
		expect(read({ filter: 'this-week', marker: 'priority' })).toMatchObject({ status: 'open', when: 'this-week', marker: 'priority' });
	});
	test('old done and all filters become a status', () => {
		expect(read({ filter: 'done' })).toMatchObject({ status: 'done', when: 'any' });
		expect(read({ filter: 'all' })).toMatchObject({ status: 'all', when: 'any' });
	});
	test('new keys win over the old filter', () => {
		expect(read({ klaarStatus: 'done', filter: 'today' })).toMatchObject({ status: 'done', when: 'any' });
	});
	test('bad values fall back to defaults', () => {
		expect(read({ status: 'bogus', sort: 7, reverse: 'yes', group: 'x' })).toEqual(DEFAULT_TABLE_STATE);
	});
	test('saved values are read', () => {
		expect(read({ klaarReverse: true, klaarSort: 'note', klaarGroup: 'none', klaarSubtasks: false })).toMatchObject({ reverse: true, sort: 'note', group: 'none', subtasks: false });
	});
	test("Bases' own sort list is not read as the Klaar sort", () => {
		expect(read({ sort: 'note', klaarSort: 'task' }).sort).toBe('task');
		expect(read({ sort: [{ property: 'file.path', direction: 'DESC' }] }).sort).toBe('date');
	});
});

describe('legacyKeysToSave', () => {
	const save = (cfg: Record<string, unknown>) => legacyKeysToSave(k => cfg[k]);
	test('an old view gets its filter and marker saved under the new keys', () => {
		expect(save({ filter: 'done', marker: 'priority' })).toEqual({ klaarStatus: 'done', klaarWhen: 'any', klaarMarker: 'priority' });
	});
	test('a view with new status keys but only the old marker gets the marker moved', () => {
		expect(save({ klaarStatus: 'done', marker: 'priority' })).toEqual({ klaarMarker: 'priority' });
	});
	test('nothing to save for a new or already moved view', () => {
		expect(save({})).toEqual({});
		expect(save({ filter: 'done', klaarStatus: 'all' })).toEqual({});
	});
});

describe('readColumns', () => {
	const read = (cfg: Record<string, unknown>) => readColumns(k => cfg[k]);
	test('nothing saved shows no optional columns', () => {
		expect(read({})).toEqual({ status: false, priority: false, tags: false, heading: false });
	});
	test('saved toggles are read', () => {
		expect(read({ klaarColPriority: true, klaarColHeading: true, klaarColTags: false })).toEqual({ status: false, priority: true, tags: false, heading: true });
	});
	test('values that are not booleans count as off', () => {
		expect(read({ klaarColStatus: 'yes', klaarColTags: 1 })).toEqual({ status: false, priority: false, tags: false, heading: false });
	});
});

describe('matchesSearch', () => {
	const t = task('Call Sam', null, { tags: ['#work'], inProgress: true });
	test('matches tags, trimmed and case-insensitive', () => expect(matchesSearch(t, '  WORK ', 'Inbox')).toBe(true));
	test('matches task text', () => expect(matchesSearch(t, 'call', 'Inbox')).toBe(true));
	test('matches the note name', () => expect(matchesSearch(t, 'inb', 'Inbox')).toBe(true));
	test('empty query matches', () => expect(matchesSearch(t, '', 'Inbox')).toBe(true));
	test('markers are not searched', () => expect(matchesSearch(t, '>>', 'Inbox')).toBe(false));
});

describe('sortTasks', () => {
	const name = (path: string) => path.replace(/\.md$/, '');
	const texts = (ts: TaskRef[]) => ts.map(t => t.text);
	const d19plain = task('d19plain', '2026-10-19');
	const d19top = task('d19top', '2026-10-19', { priority: 3 });
	const d19low = task('d19low', '2026-10-19', { priority: 1 });
	const d19prog = task('d19prog', '2026-10-19', { inProgress: true });
	const w43 = task('w43', '2026-W43');
	const none = task('none', null);
	const tasks = [none, w43, d19plain, d19prog, d19low, d19top];

	test('date: oldest first, priority first within a date, undated last', () => {
		expect(texts(sortTasks(tasks, 'date', false, name))).toEqual(['d19top', 'd19low', 'd19prog', 'd19plain', 'w43', 'none']);
	});
	test('date reversed: newest first, undated still last, same tie order', () => {
		expect(texts(sortTasks(tasks, 'date', true, name))).toEqual(['w43', 'd19top', 'd19low', 'd19prog', 'd19plain', 'none']);
	});
	test('priority: highest first, ties by date', () => {
		const p = [task('a', null, { priority: 2 }), task('b', '2026-10-19'), task('c', '2026-10-20', { priority: 3 }), task('d', '2026-10-19', { inProgress: true }), task('e', null)];
		expect(texts(sortTasks(p, 'priority', false, name))).toEqual(['c', 'a', 'd', 'b', 'e']);
		expect(texts(sortTasks(p, 'priority', true, name))).toEqual(['b', 'e', 'd', 'a', 'c']);
	});
	test('note: A to Z ignoring case, ties by date', () => {
		const n = [task('x', '2026-10-20', { path: 'beta.md' }), task('y', '2026-10-19', { path: 'Alpha.md' }), task('z', '2026-10-19', { path: 'beta.md' })];
		expect(texts(sortTasks(n, 'note', false, name))).toEqual(['y', 'z', 'x']);
	});
	test('task: A to Z by text', () => {
		const n = [task('banana', null, { inProgress: true }), task('Apple', null), task('cherry', null)];
		expect(texts(sortTasks(n, 'task', false, name))).toEqual(['Apple', 'banana', 'cherry']);
	});
	test('returns a copy', () => {
		const copy = [w43, none];
		sortTasks(copy, 'date', true, name);
		expect(texts(copy)).toEqual(['w43', 'none']);
	});
});

describe('groupTasks', () => {
	const name = (path: string) => path.replace(/\.md$/, '');
	const state = (s: Partial<TableState>): TableState => ({ ...DEFAULT_TABLE_STATE, ...s });
	const labels = (tasks: TaskRef[], s: Partial<TableState>) => groupTasks(tasks, state(s), name).map(g => g.label);
	const dated = [task('none', null), task('w43', '2026-W43'), task('d19', '2026-10-19')];

	test('by date: oldest first, Undated last', () => {
		expect(labels(dated, { group: 'date' })).toEqual(['2026-10-19', '2026-W43', 'Undated']);
	});
	test('by date with date sort reversed: groups reverse, Undated last', () => {
		expect(labels(dated, { group: 'date', sort: 'date', reverse: true })).toEqual(['2026-W43', '2026-10-19', 'Undated']);
	});
	test('by date with another sort reversed: groups keep their order', () => {
		expect(labels(dated, { group: 'date', sort: 'priority', reverse: true })).toEqual(['2026-10-19', '2026-W43', 'Undated']);
	});
	test('by note: note names A to Z', () => {
		expect(labels([task('a', null, { path: 'b.md' }), task('b', null, { path: 'A.md' })], { group: 'note' })).toEqual(['A', 'b']);
	});
	const marked = [task('plain', null), task('prog', null, { inProgress: true }), task('one', null, { priority: 1 }), task('three', null, { priority: 3 })];
	test('by priority: only non-empty groups, in-progress goes to No priority', () => {
		const g = groupTasks(marked, state({ group: 'priority' }), name);
		expect(g.map(x => [x.label, x.tasks.map(t => t.text)])).toEqual([['High', ['three']], ['Low', ['one']], ['No priority', ['prog', 'plain']]]);
	});
	test('by priority with priority sort reversed: No priority stays last', () => {
		expect(labels(marked, { group: 'priority', sort: 'priority', reverse: true })).toEqual(['Low', 'High', 'No priority']);
	});
	test('none: one unlabelled group, or nothing when empty', () => {
		const g = groupTasks(dated, state({ group: 'none' }), name);
		expect(g.map(x => [x.label, x.tasks.map(t => t.text)])).toEqual([['', ['d19', 'w43', 'none']]]);
		expect(groupTasks([], state({ group: 'none' }), name)).toEqual([]);
	});
	test('rows inside a group follow the sort', () => {
		const g = groupTasks([task('a', '2026-10-19'), task('b', '2026-10-19', { priority: 2 })], state({ group: 'date' }), name);
		expect(g[0]?.tasks.map(t => t.text)).toEqual(['b', 'a']);
	});
});

describe('filterTasks subtasks', () => {
	const parent = task('parent', null);
	const child = task('child', null, { subtask: true });
	const run = (subtasks: boolean) => filterTasks([parent, child], { ...DEFAULT_TABLE_STATE, subtasks }, '', today, () => 'Other').map(t => t.text);
	test('shown by default', () => expect(run(true)).toEqual(['parent', 'child']));
	test('hidden when switched off', () => expect(run(false)).toEqual(['parent']));
});

describe('tag filter', () => {
	const claude = task('ask', null, { tags: ['#Claude'] });
	const nested = task('review', null, { tags: ['#claude/review'] });
	const other = task('other', null, { tags: ['#claudette'] });
	const plain = task('plain', null);
	test('any tag keeps everything', () => expect([claude, plain].filter(t => matchesTag(t, 'any'))).toHaveLength(2));
	test('matches the tag and its nested tags, ignoring case', () => {
		expect([claude, nested, other, plain].filter(t => matchesTag(t, '#claude')).map(t => t.text)).toEqual(['ask', 'review']);
	});
	test('a nested tag does not match its parent', () => expect(matchesTag(claude, '#claude/review')).toBe(false));
	test('filterTasks applies it', () => {
		expect(filterTasks([claude, plain], { ...DEFAULT_TABLE_STATE, status: 'all', tag: '#claude' }, '', today, () => 'Other').map(t => t.text)).toEqual(['ask']);
	});
	test('readTableState reads a saved tag; anything else is any', () => {
		expect(readTableState(k => (k === 'klaarTag' ? '#claude' : undefined)).tag).toBe('#claude');
		expect(readTableState(k => (k === 'klaarTag' ? 'claude' : undefined)).tag).toBe('any');
		expect(readTableState(k => (k === 'klaarTag' ? 3 : undefined)).tag).toBe('any');
	});
});

describe('taskTags', () => {
	test('every tag and its parents, once ignoring case, sorted', () => {
		const tasks = [task('a', null, { tags: ['#work', '#Claude/review'] }), task('b', null, { tags: ['#claude', '#Work'] })];
		expect(taskTags(tasks)).toEqual(['#Claude', '#Claude/review', '#work']);
	});
	test('no tasks, no tags', () => expect(taskTags([])).toEqual([]));
});

describe('groupTasks by tag', () => {
	const both = task('both', null, { tags: ['#claude', '#bugs'] });
	const one = task('one', null, { tags: ['#Claude'] });
	const none = task('none', null);
	const groups = groupTasks([none, one, both], { ...DEFAULT_TABLE_STATE, group: 'tag' }, () => 'Other');
	test('one group per tag, alphabetical, untagged last', () => {
		expect(groups.map(g => g.label)).toEqual(['#bugs', '#claude', 'No tag']);
	});
	test('a task with two tags is in both groups; case is ignored', () => {
		expect(groups.map(g => g.tasks.map(t => t.text))).toEqual([['both'], ['one', 'both'], ['none']]);
	});
	test('readTableState accepts the tag group', () => expect(readTableState(k => (k === 'klaarGroup' ? 'tag' : undefined)).group).toBe('tag'));
});
