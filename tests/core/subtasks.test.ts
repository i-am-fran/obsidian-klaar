import { describe, expect, test } from 'vitest';
import { parentOf, parentLabel, subtaskProgress } from '../../src/core/subtasks';
import type { TaskRef } from '../../src/core/tasks';

function task(line: number, text: string, extra: Partial<TaskRef> = {}): TaskRef {
	return { path: 'a.md', line, raw: `- [ ] ${text}`, checked: false, cancelled: false, someday: false, question: false, idea: false, next: false, text, scheduleKey: null, explicit: false, doneDate: null, inProgress: false, priority: 0, tags: [], heading: null, subtask: extra.parent !== undefined && extra.parent !== null, parent: null, ...extra };
}

describe('parentOf', () => {
	const parent = task(0, 'Release');
	const child = task(1, 'Review', { parent: 0, subtask: true });
	test('finds the parent task in the same note', () => {
		expect(parentOf([parent, child], child)).toBe(parent);
	});
	test('a top-level task has none', () => {
		expect(parentOf([parent, child], parent)).toBeNull();
	});
	test('a task at the same line in another note is not the parent', () => {
		expect(parentOf([{ ...parent, path: 'b.md' }, child], child)).toBeNull();
	});
});

describe('subtaskProgress', () => {
	test('counts direct subtasks, done ones and all', () => {
		const tasks = [
			task(0, 'Release'),
			task(1, 'Review', { parent: 0, checked: true }),
			task(2, 'Post', { parent: 0 }),
			task(3, 'Draft', { parent: 2 }),
		];
		expect(subtaskProgress(tasks, tasks[0]!)).toEqual({ done: 1, total: 2 });
		expect(subtaskProgress(tasks, tasks[2]!)).toEqual({ done: 0, total: 1 });
	});
	test('cancelled subtasks are left out', () => {
		const tasks = [task(0, 'Release'), task(1, 'Old', { parent: 0, cancelled: true }), task(2, 'Post', { parent: 0, checked: true })];
		expect(subtaskProgress(tasks, tasks[0]!)).toEqual({ done: 1, total: 1 });
	});
	test('null without subtasks, or with only cancelled ones', () => {
		const tasks = [task(0, 'Release'), task(1, 'Old', { parent: 0, cancelled: true }), task(2, 'Alone')];
		expect(subtaskProgress(tasks, tasks[0]!)).toBeNull();
		expect(subtaskProgress(tasks, tasks[2]!)).toBeNull();
	});
	test('only the same note counts', () => {
		const tasks = [task(0, 'Release'), task(1, 'Elsewhere', { parent: 0, path: 'b.md' })];
		expect(subtaskProgress(tasks, tasks[0]!)).toBeNull();
	});
});

describe('parentLabel', () => {
	test('drops tags and squeezes spaces', () => {
		expect(parentLabel('Release  new version #p1 #klaar')).toBe('Release new version');
	});
	test('a parent that is only tags falls back to the raw text', () => {
		expect(parentLabel('#p1')).toBe('#p1');
	});
});
