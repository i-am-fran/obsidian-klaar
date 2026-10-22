import { describe, expect, test } from 'vitest';
import type { TaskRef } from '../../src/core/tasks';
import { newlyChecked, newlyUnchecked } from '../../src/core/newlyChecked';

function task(line: number, text: string, checked: boolean, doneDate: string | null = null, cancelled = false): TaskRef {
	const mark = checked ? 'x' : cancelled ? '-' : ' ';
	return { path: 'a.md', line, raw: `- [${mark}] ${text}`, checked, cancelled, someday: false, next: false, text, scheduleKey: null, explicit: false, doneDate, inProgress: false, priority: 0, status: null, tags: [], heading: null, subtask: false };
}

describe('newlyChecked', () => {
	test('open task that is now checked without a stamp', () => {
		const next = [task(0, 'A', true)];
		expect(newlyChecked([task(0, 'A', false)], next)).toEqual(next);
	});
	test('already checked before is not new', () => {
		expect(newlyChecked([task(0, 'A', true)], [task(0, 'A', true)])).toEqual([]);
	});
	test('already stamped is skipped', () => {
		expect(newlyChecked([task(0, 'A', false)], [task(0, 'A', true, '2026-10-19')])).toEqual([]);
	});
	test('cancelling is never stamped', () => {
		expect(newlyChecked([task(0, 'A', false)], [task(0, 'A', false, null, true)])).toEqual([]);
	});
	test('unticking is not new', () => {
		expect(newlyChecked([task(0, 'A', true, '2026-10-19')], [task(0, 'A', false)])).toEqual([]);
	});
	test('tasks that moved lines still match by text', () => {
		const next = [task(3, 'A', true)];
		expect(newlyChecked([task(1, 'A', false)], next)).toEqual(next);
	});
	test('new checked task with no previous counterpart is ignored', () => {
		expect(newlyChecked([], [task(0, 'A', true)])).toEqual([]);
	});
	test('duplicate texts pair by order', () => {
		const prev = [task(0, 'A', false), task(1, 'A', true, '2026-10-01')];
		const next = [task(0, 'A', true), task(1, 'A', true, '2026-10-01')];
		expect(newlyChecked(prev, next)).toEqual([next[0]]);
	});
	test('duplicate texts with changed count are ambiguous and skipped', () => {
		const prev = [task(0, 'A', false)];
		const next = [task(0, 'A', true), task(1, 'A', false)];
		expect(newlyChecked(prev, next)).toEqual([]);
	});
});

describe('newlyUnchecked', () => {
	test('stamped done task that is now open', () => {
		const next = [task(0, 'A', false, '2026-10-19')];
		expect(newlyUnchecked([task(0, 'A', true, '2026-10-19')], next)).toEqual(next);
	});
	test('open task without a stamp has nothing to remove', () => {
		expect(newlyUnchecked([task(0, 'A', true)], [task(0, 'A', false)])).toEqual([]);
	});
	test('already open before is not new', () => {
		expect(newlyUnchecked([task(0, 'A', false, '2026-10-19')], [task(0, 'A', false, '2026-10-19')])).toEqual([]);
	});
	test('done to cancelled keeps its stamp', () => {
		expect(newlyUnchecked([task(0, 'A', true, '2026-10-19')], [task(0, 'A', false, '2026-10-19', true)])).toEqual([]);
	});
	test('duplicate texts with changed count are ambiguous and skipped', () => {
		const prev = [task(0, 'A', true, '2026-10-19')];
		const next = [task(0, 'A', false, '2026-10-19'), task(1, 'A', false)];
		expect(newlyUnchecked(prev, next)).toEqual([]);
	});
});
