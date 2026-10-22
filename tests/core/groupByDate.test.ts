import { describe, expect, test } from 'vitest';
import { groupByDate } from '../../src/core/query';
import type { TaskRef } from '../../src/core/tasks';

function task(text: string, scheduleKey: string | null): TaskRef {
	return { path: 'A.md', line: 0, raw: `- [ ] ${text}`, checked: false, cancelled: false, someday: false, next: false, text, scheduleKey, explicit: true, doneDate: null, inProgress: false, priority: 0, status: null, tags: [], heading: null, subtask: false };
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

	test('orders mixed period kinds by start date, ties broken by key', () => {
		const groups = groupByDate([task('day', '2026-10-19'), task('week', '2026-W43'), task('month', '2026-10'), task('year', '2026')]);
		expect(groups.map(g => g.key)).toEqual(['2026', '2026-10', '2026-10-19', '2026-W43']);
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
