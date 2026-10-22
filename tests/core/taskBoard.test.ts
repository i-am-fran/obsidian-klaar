import { describe, expect, test } from 'vitest';
import { ALL_PERIODS } from '../../src/core/periods';
import { DEFAULT_TAG_RULES, type TagRule } from '../../src/core/tagRules';
import { ALL_MARKERS } from '../../src/core/taskLine';
import { boardColumns, DEFAULT_BOARD_STATE, dropAction, readBoardState, rewriteForColumn, visibleCards } from '../../src/core/taskBoard';
import type { BoardBy } from '../../src/core/taskBoard';
import type { TaskRef } from '../../src/core/tasks';

function task(text: string, scheduleKey: string | null, extra: Partial<TaskRef> = {}): TaskRef {
	return { path: 'Other.md', line: 0, raw: `- [ ] ${text}`, checked: false, cancelled: false, someday: false, next: false, text, scheduleKey, explicit: true, doneDate: null, inProgress: false, priority: 0, tags: [], heading: null, subtask: false, ...extra };
}

const today = '2026-10-21';
const rules: TagRule[] = [...DEFAULT_TAG_RULES, { tag: 'in-progress', color: '#30a46c', role: 'in-progress' }];
const cols = (tasks: TaskRef[], by: BoardBy, r = rules, showDone = true, useMarker = false) => boardColumns(tasks, by, today, r, showDone, useMarker);
const ids = (tasks: TaskRef[], by: BoardBy, r = rules, showDone = true, useMarker = false) => cols(tasks, by, r, showDone, useMarker).map(c => c.id);
const texts = (tasks: TaskRef[], by: BoardBy, id: string) => cols(tasks, by).find(c => c.id === id)?.tasks.map(t => t.text);

describe('readBoardState', () => {
	test('empty gives defaults', () => expect(readBoardState(() => undefined)).toEqual(DEFAULT_BOARD_STATE));
	test('reads saved values', () => {
		const saved: Record<string, unknown> = { klaarBoardBy: 'date', klaarShowDone: false, klaarColumnWidth: 320 };
		expect(readBoardState(k => saved[k])).toEqual({ by: 'date', showDone: false, columnWidth: 320, tagColumns: [] });
	});
	test('bad values fall back or clamp', () => {
		const bad: Record<string, unknown> = { klaarBoardBy: 'x', klaarShowDone: 'no', klaarColumnWidth: 'wide' };
		expect(readBoardState(k => bad[k])).toEqual(DEFAULT_BOARD_STATE);
		expect(readBoardState(k => (k === 'klaarColumnWidth' ? -5 : undefined)).columnWidth).toBe(200);
	});
	test('tag columns: strings only, trimmed, no #, blanks or repeats', () => {
		const saved: Record<string, unknown> = { klaarTagColumns: [' #Waiting', 'blocked', '', 'waiting', 3, '#'] };
		expect(readBoardState(k => saved[k]).tagColumns).toEqual(['Waiting', 'blocked']);
		expect(readBoardState(k => (k === 'klaarTagColumns' ? 'waiting' : undefined)).tagColumns).toEqual([]);
	});
	test('column width is clamped to 200-480', () => {
		expect(readBoardState(k => (k === 'klaarColumnWidth' ? 100 : undefined)).columnWidth).toBe(200);
		expect(readBoardState(k => (k === 'klaarColumnWidth' ? 900 : undefined)).columnWidth).toBe(480);
		expect(readBoardState(k => (k === 'klaarColumnWidth' ? NaN : undefined)).columnWidth).toBe(280);
	});
});

describe('boardColumns by status', () => {
	const tasks = [task('a', null), task('b', null, { inProgress: true }), task('c', null, { checked: true }), task('d', null, { cancelled: true })];
	test('splits by state, dropping cancelled', () => {
		expect(texts(tasks, 'status', 'todo')).toEqual(['a']);
		expect(texts(tasks, 'status', 'in-progress')).toEqual(['b']);
		expect(texts(tasks, 'status', 'done')).toEqual(['c']);
	});
	test('labels', () => expect(cols(tasks, 'status').map(c => c.label)).toEqual(['To do', 'Next', 'In progress', 'Someday', 'Done']));
	test('showDone false hides done', () => expect(ids(tasks, 'status', rules, false)).toEqual(['todo', 'next', 'in-progress', 'someday']));
	test('no in-progress rule', () => expect(ids(tasks, 'status', DEFAULT_TAG_RULES)).toEqual(['todo', 'next', 'someday', 'done']));
	test('no in-progress rule but the [/] marker in use', () => expect(ids(tasks, 'status', DEFAULT_TAG_RULES, true, true)).toEqual(['todo', 'next', 'in-progress', 'someday', 'done']));
	test('in-progress task without the rule goes to todo', () => {
		expect(boardColumns(tasks, 'status', today, DEFAULT_TAG_RULES, true, false).find(c => c.id === 'todo')?.tasks.map(t => t.text)).toEqual(['a', 'b']);
	});
	test('keeps input order', () => {
		expect(texts([task('z', null), task('a', null)], 'status', 'todo')).toEqual(['z', 'a']);
	});
});

describe('boardColumns with next and someday', () => {
	const tasks = [task('a', null), task('n', null, { next: true }), task('s', '2026-10-20', { someday: true }), task('np', null, { next: true, inProgress: true })];
	test('next and someday get their own columns', () => {
		expect(texts(tasks, 'status', 'todo')).toEqual(['a']);
		expect(texts(tasks, 'status', 'next')).toEqual(['n']);
		expect(texts(tasks, 'status', 'someday')).toEqual(['s']);
	});
	test('in progress wins over next', () => expect(texts(tasks, 'status', 'in-progress')).toEqual(['np']));
	test('markers off: no columns, next tasks go to todo', () => {
		const off = boardColumns(tasks, 'status', today, rules, true, false, { next: false, someday: false });
		expect(off.map(c => c.id)).toEqual(['todo', 'in-progress', 'done']);
		expect(off[0]?.tasks.map(t => t.text)).toEqual(['a', 'n']);
	});
	test('someday tasks stay off the priority and date boards', () => {
		expect(cols(tasks, 'priority').flatMap(c => c.tasks.map(t => t.text))).not.toContain('s');
		expect(cols(tasks, 'date').flatMap(c => c.tasks.map(t => t.text))).not.toContain('s');
	});
});

describe('boardColumns by priority', () => {
	const tasks = [task('l', null, { priority: 1 }), task('h', null, { priority: 3 }), task('n', null), task('m', null, { priority: 2 }), task('d', null, { priority: 3, checked: true })];
	test('ids and placement', () => {
		expect(ids(tasks, 'priority')).toEqual(['high', 'medium', 'low', 'none']);
		expect(texts(tasks, 'priority', 'high')).toEqual(['h']);
		expect(texts(tasks, 'priority', 'medium')).toEqual(['m']);
		expect(texts(tasks, 'priority', 'low')).toEqual(['l']);
		expect(texts(tasks, 'priority', 'none')).toEqual(['n']);
	});
	test('no medium without the p2 rule', () => {
		expect(ids(tasks, 'priority', rules.filter(r => r.tag !== '#p2' && r.tag !== 'p2'))).toEqual(['high', 'low', 'none']);
	});
});

describe('boardColumns by date', () => {
	const tasks = [
		task('over', '2026-10-20'), task('today', '2026-10-21'), task('week', '2026-W43'), task('day', '2026-10-23'),
		task('later', '2026-11'), task('none', null), task('done', '2026-10-20', { checked: true }),
	];
	test('buckets', () => {
		expect(ids(tasks, 'date')).toEqual(['overdue', 'today', 'this-week', 'later', 'undated']);
		expect(texts(tasks, 'date', 'overdue')).toEqual(['over']);
		expect(texts(tasks, 'date', 'today')).toEqual(['today']);
		expect(texts(tasks, 'date', 'this-week')).toEqual(['week', 'day']);
		expect(texts(tasks, 'date', 'later')).toEqual(['later']);
		expect(texts(tasks, 'date', 'undated')).toEqual(['none']);
	});
});

describe('boardColumns with tag columns', () => {
	const tagColumns = ['Waiting', 'blocked'];
	const tasks = [
		task('a', null),
		task('w', null, { tags: ['#waiting'] }),
		task('both', null, { tags: ['#blocked', '#Waiting'] }),
		task('nw', null, { next: true, tags: ['#waiting'] }),
		task('pw', null, { inProgress: true, tags: ['#waiting'] }),
		task('b', null, { tags: ['#blocked'] }),
		task('dw', null, { checked: true, tags: ['#waiting'] }),
		task('sw', null, { someday: true, tags: ['#waiting'] }),
	];
	const status = boardColumns(tasks, 'status', today, rules, true, false, ALL_MARKERS, tagColumns);
	const col = (id: string) => status.find(c => c.id === id)?.tasks.map(t => t.text);
	test('a column each, after In progress, titled as typed', () => {
		expect(status.map(c => c.id)).toEqual(['todo', 'next', 'in-progress', 'tag:waiting', 'tag:blocked', 'someday', 'done']);
		expect(status.map(c => c.label)).toEqual(['To do', 'Next', 'In progress', 'Waiting', 'Blocked', 'Someday', 'Done']);
	});
	test('the first listed tag wins, over To do, Next and In progress', () => {
		expect(col('tag:waiting')).toEqual(['w', 'both', 'nw', 'pw']);
		expect(col('tag:blocked')).toEqual(['b']);
		expect(col('todo')).toEqual(['a']);
		expect(col('next')).toEqual([]);
		expect(col('in-progress')).toEqual([]);
	});
	test('done and someday tasks stay in their own columns', () => {
		expect(col('done')).toEqual(['dw']);
		expect(col('someday')).toEqual(['sw']);
	});
	test('no tag columns without a list, or on other boards', () => {
		expect(ids(tasks, 'status')).toEqual(['todo', 'next', 'in-progress', 'someday', 'done']);
		expect(boardColumns(tasks, 'priority', today, rules, true, false, ALL_MARKERS, tagColumns).some(c => c.id.startsWith('tag:'))).toBe(false);
	});
});

describe('rewriteForColumn with tag columns', () => {
	const ctx = { today, rules, stampDone: true, useMarker: true, tagColumns: ['Waiting', 'blocked'] };
	const rw = (line: string, id: Parameters<typeof rewriteForColumn>[2]) => rewriteForColumn(line, 'status', id, ctx);
	test('adds the tag as typed, dropping other column tags, markers and in-progress', () => {
		expect(rw('- [ ] A', 'tag:waiting')).toBe('- [ ] A #Waiting');
		expect(rw('- [/] A #in-progress #blocked', 'tag:waiting')).toBe('- [ ] A #Waiting');
		expect(rw('- [>] A >[[2026-10-23]]', 'tag:blocked')).toBe('- [ ] A #blocked >[[2026-10-23]]');
		expect(rw('- [x] A (@done [[2026-10-01]])', 'tag:waiting')).toBe('- [ ] A #Waiting');
	});
	test('other status columns drop the column tags', () => {
		expect(rw('- [ ] A #waiting #bugs', 'todo')).toBe('- [ ] A #bugs');
		expect(rw('- [ ] A #waiting', 'next')).toBe('- [>] A');
		expect(rw('- [ ] A #waiting', 'in-progress')).toBe('- [/] A');
		expect(rw('- [ ] A #waiting', 'done')).toBe('- [x] A (@done [[2026-10-21]])');
	});
	test('an unknown tag column leaves the line alone', () => expect(rw('- [ ] A #waiting', 'tag:gone')).toBe('- [ ] A #waiting'));
});

describe('dropAction', () => {
	test('cases', () => {
		expect(dropAction('date', 'overdue', ALL_PERIODS)).toBe('none');
		expect(dropAction('date', 'later', ALL_PERIODS)).toBe('pick');
		expect(dropAction('date', 'this-week', { ...ALL_PERIODS, week: false })).toBe('pick');
		expect(dropAction('date', 'today', ALL_PERIODS)).toBe('rewrite');
		expect(dropAction('date', 'today', { ...ALL_PERIODS, day: false })).toBe('pick');
		expect(dropAction('date', 'undated', ALL_PERIODS)).toBe('rewrite');
		expect(dropAction('status', 'done', ALL_PERIODS)).toBe('rewrite');
		expect(dropAction('priority', 'none', ALL_PERIODS)).toBe('rewrite');
	});
});

describe('rewriteForColumn', () => {
	const ctx = { today, rules, stampDone: true, useMarker: false };
	const rw = (line: string, by: BoardBy, id: Parameters<typeof rewriteForColumn>[2]) => rewriteForColumn(line, by, id, ctx);
	test('status done', () => {
		expect(rw('- [ ] A #in-progress', 'status', 'done')).toBe('- [x] A (@done [[2026-10-21]])');
		expect(rw('- [x] A (@done [[2026-10-01]])', 'status', 'done')).toBe('- [x] A (@done [[2026-10-01]])');
	});
	test('status todo', () => expect(rw('- [x] A (@done [[2026-10-01]])', 'status', 'todo')).toBe('- [ ] A'));
	test('status todo drops in-progress', () => expect(rw('- [ ] A #in-progress', 'status', 'todo')).toBe('- [ ] A'));
	test('status in-progress', () => expect(rw('- [ ] A', 'status', 'in-progress')).toBe('- [ ] A #in-progress'));
	test('status in-progress reopens a done task', () => expect(rw('- [x] A (@done [[2026-10-01]])', 'status', 'in-progress')).toBe('- [ ] A #in-progress'));
	test('status todo clears the [/] marker too', () => expect(rw('- [/] A #in-progress', 'status', 'todo')).toBe('- [ ] A'));
	test('status todo reopens a cancelled task', () => expect(rw('- [-] A', 'status', 'todo')).toBe('- [ ] A'));
	test('priority', () => expect(rw('- [ ] A #p1 #p3', 'priority', 'medium')).toBe('- [ ] A #p2'));
	test('date', () => {
		expect(rw('- [ ] A', 'date', 'today')).toBe('- [ ] A >[[2026-10-21]]');
		expect(rw('- [ ] A', 'date', 'this-week')).toBe('- [ ] A >[[2026-W43]]');
		expect(rw('- [ ] A >[[2026-10-01]]', 'date', 'undated')).toBe('- [ ] A');
	});
});

describe('rewriteForColumn with the [/] marker', () => {
	const ctx = { today, rules: DEFAULT_TAG_RULES, stampDone: true, useMarker: true };
	const rw = (line: string, id: Parameters<typeof rewriteForColumn>[2]) => rewriteForColumn(line, 'status', id, ctx);
	test('in-progress writes [/]', () => expect(rw('- [ ] A', 'in-progress')).toBe('- [/] A'));
	test('in-progress reopens a done task as [/]', () => expect(rw('- [x] A (@done [[2026-10-01]])', 'in-progress')).toBe('- [/] A'));
	test('todo clears [/]', () => expect(rw('- [/] A', 'todo')).toBe('- [ ] A'));
	test('done ticks [/]', () => expect(rw('- [/] A', 'done')).toBe('- [x] A (@done [[2026-10-21]])'));
	test('next writes [>]', () => {
		expect(rw('- [ ] A', 'next')).toBe('- [>] A');
		expect(rw('- [/] A', 'next')).toBe('- [>] A');
		expect(rw('- [x] A (@done [[2026-10-01]])', 'next')).toBe('- [>] A');
	});
	test('someday writes [<]', () => {
		expect(rw('- [>] A', 'someday')).toBe('- [<] A');
		expect(rw('- [-] A', 'someday')).toBe('- [<] A');
	});
	test('todo clears [>] and [<]', () => {
		expect(rw('- [>] A', 'todo')).toBe('- [ ] A');
		expect(rw('- [<] A', 'todo')).toBe('- [ ] A');
	});
	test('in-progress from [>] and [<] writes [/]', () => {
		expect(rw('- [>] A', 'in-progress')).toBe('- [/] A');
		expect(rw('- [<] A', 'in-progress')).toBe('- [/] A');
	});
	test('done ticks [>] and [<]', () => {
		expect(rw('- [>] A', 'done')).toBe('- [x] A (@done [[2026-10-21]])');
		expect(rw('- [<] A', 'done')).toBe('- [x] A (@done [[2026-10-21]])');
	});
	test('done also drops a leftover tag', () => {
		expect(rewriteForColumn('- [/] A #in-progress', 'status', 'done', { ...ctx, rules })).toBe('- [x] A (@done [[2026-10-21]])');
	});
});

describe('visibleCards', () => {
	const many = Array.from({ length: 5 }, (_, i) => task(`t${i}`, null));
	test('a short column shows every card', () => {
		expect(visibleCards(many, false, 10)).toEqual({ shown: many, hidden: 0 });
	});
	test('a long column shows the first cards and counts the rest', () => {
		expect(visibleCards(many, false, 3)).toEqual({ shown: many.slice(0, 3), hidden: 2 });
	});
	test('an expanded column shows everything', () => {
		expect(visibleCards(many, true, 3)).toEqual({ shown: many, hidden: 0 });
	});
});
