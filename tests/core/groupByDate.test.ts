import { describe, expect, test } from 'vitest';
import { groupByDate } from '../../src/core/query';
import type { TaskRef } from '../../src/core/tasks';

function task(text: string, scheduleKey: string | null): TaskRef {
	return { path: 'A.md', line: 0, raw: `- [ ] ${text}`, checked: false, cancelled: false, someday: false, question: false, idea: false, next: false, text, scheduleKey, explicit: true, doneDate: null, inProgress: false, priority: 0, tags: [], heading: null, parent: null };
}

describe('groupByDate', () => {
	test('returns no groups for no tasks', () => {
		expect(groupByDate([])).toEqual([]);
	});

	test('groups by schedule key, label = key, ascending by period start', () => {
		const a = task('a', '2026-10-22');
		const b = task('b', '2026-10-19');
		const c = task('c', '2026-10-22');
		expect(groupByDate([a, b, c])).toEqual([
			{ label: '2026-10-19', key: '2026-10-19', tasks: [b] },
			{ label: '2026-10-22', key: '2026-10-22', tasks: [a, c] },
		]);
	});

	test('orders mixed period kinds by deadline: day, week, month, quarter, year', () => {
		const groups = groupByDate([task('year', '2026'), task('quarter', '2026-Q4'), task('month', '2026-11'), task('day', '2026-11-02'), task('week', '2026-W45')]);
		expect(groups.map(g => g.key)).toEqual(['2026-11-02', '2026-W45', '2026-11', '2026-Q4', '2026']);
	});

	test('overdue: the longest-passed deadline first, a day before the week it ended in', () => {
		const groups = groupByDate([task('lastWeek', '2026-W44'), task('lastWed', '2026-10-28'), task('twoWeeks', '2026-W43'), task('sunday', '2026-11-01')]);
		expect(groups.map(g => g.key)).toEqual(['2026-W43', '2026-10-28', '2026-11-01', '2026-W44']);
	});

	test('puts undated tasks in a final "Undated" group', () => {
		const u = task('u', null);
		const d = task('d', '2026-10-19');
		expect(groupByDate([u, d])).toEqual([
			{ label: '2026-10-19', key: '2026-10-19', tasks: [d] },
			{ label: 'Undated', key: null, tasks: [u] },
		]);
	});

	test('ignores unparseable schedule keys by treating them as undated', () => {
		const bad = task('bad', 'nonsense');
		expect(groupByDate([bad])).toEqual([{ label: 'Undated', key: null, tasks: [bad] }]);
	});
});
