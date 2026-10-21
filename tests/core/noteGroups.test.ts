import { describe, expect, test } from 'vitest';
import { groupByNote, noteName } from '../../src/core/noteGroups';
import type { TaskRef } from '../../src/core/tasks';

const task = (path: string, line: number, heading: string | null): TaskRef => ({ path, line, heading, text: `t${line}` }) as TaskRef;

describe('noteName', () => {
	test('drops folders and the .md extension', () => {
		expect(noteName('Projects/Training Plan 2026.md')).toBe('Training Plan 2026');
		expect(noteName('Home.md')).toBe('Home');
	});
});

describe('groupByNote', () => {
	test('one group per note, sorted by note name', () => {
		const groups = groupByNote([task('B/Zeta.md', 1, null), task('A/alpha.md', 1, null), task('C/Beta.md', 1, null)]);
		expect(groups.map((g) => g.name)).toEqual(['alpha', 'Beta', 'Zeta']);
	});
	test('inside a note, headings keep document order and tasks keep line order', () => {
		const [group] = groupByNote([task('n.md', 9, 'Later'), task('n.md', 2, 'Early'), task('n.md', 3, 'Early'), task('n.md', 5, 'Early')]);
		expect(group?.headings.map((h) => h.heading)).toEqual(['Early', 'Later']);
		expect(group?.headings[0]?.tasks.map((t) => t.line)).toEqual([2, 3, 5]);
	});
	test('tasks above any heading come first, with a null heading', () => {
		const [group] = groupByNote([task('n.md', 6, 'Plan'), task('n.md', 1, null)]);
		expect(group?.headings.map((h) => h.heading)).toEqual([null, 'Plan']);
	});
	test('a heading that repeats the note name is dropped, so its tasks join the ones above any heading', () => {
		const [group] = groupByNote([task('Klaar tag check.md', 1, 'Klaar tag check'), task('Klaar tag check.md', 4, 'klaar tag check'), task('Klaar tag check.md', 7, 'Plan')]);
		expect(group?.headings.map((h) => h.heading)).toEqual([null, 'Plan']);
		expect(group?.headings[0]?.tasks.map((t) => t.line)).toEqual([1, 4]);
	});
	test('notes with the same name in different folders stay separate', () => {
		const groups = groupByNote([task('a/Home.md', 1, null), task('b/Home.md', 1, null)]);
		expect(groups.map((g) => g.path)).toEqual(['a/Home.md', 'b/Home.md']);
	});
	test('no tasks, no groups', () => {
		expect(groupByNote([])).toEqual([]);
	});
});
