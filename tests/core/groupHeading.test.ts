import { describe, expect, test } from 'vitest';
import { groupHeading } from '../../src/core/groupHeading';
import { parsePeriodKey } from '../../src/core/periods';
import type { Period } from '../../src/core/periods';
import type { TaskGroup } from '../../src/core/query';
import type { TaskRef } from '../../src/core/tasks';

const p = (key: string) => parsePeriodKey(key) as Period;
const group = (label: string, n: number): TaskGroup => ({ label, key: null, tasks: Array.from({ length: n }, () => ({}) as TaskRef) });

describe('groupHeading', () => {
	test('own group names the period kind', () => {
		expect(groupHeading(group('Scheduled', 2), p('2026-W43'), '2026-10-19')).toEqual({ title: 'Scheduled for this week', count: 2 });
		expect(groupHeading(group('Scheduled', 1), p('2026-10'), '2026-10-19')).toEqual({ title: 'Scheduled for this month', count: 1 });
	});
	test('a day that is not today', () => {
		expect(groupHeading(group('Scheduled', 1), p('2026-10-20'), '2026-10-19')).toEqual({ title: 'Scheduled for this day', count: 1 });
	});
	test('today uses "today"', () => {
		expect(groupHeading(group('Scheduled', 3), p('2026-10-19'), '2026-10-19')).toEqual({ title: 'Scheduled for today', count: 3 });
	});
	test('child and overdue groups show their label', () => {
		expect(groupHeading(group('2026-10-22', 1), p('2026-W43'), '2026-10-19')).toEqual({ title: '2026-10-22', count: 1 });
		expect(groupHeading(group('Overdue', 4), p('2026-10-19'), '2026-10-19')).toEqual({ title: 'Overdue', count: 4 });
	});
});
