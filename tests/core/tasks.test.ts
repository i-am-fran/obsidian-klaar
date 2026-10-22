import { describe, expect, test } from 'vitest';
import { parsePeriodKey } from '../../src/core/periods';
import { DEFAULT_TAG_RULES, type TagRule } from '../../src/core/tagRules';

const withTag: TagRule[] = [...DEFAULT_TAG_RULES, { tag: 'in-progress', color: '#30a46c', role: 'in-progress' }];
import { extractTasks, locateTaskLine } from '../../src/core/tasks';

const lines = ['# 2026-W43', '- [ ] Plan budget', '```', '- [ ] not a task', '```', '- [ ] Call >[[2026-10-22]]'];

describe('extractTasks', () => {
	test('only listed task lines, implicit vs explicit', () => {
		const t = extractTasks('Notes/2026-W43.md', lines, [1, 5], parsePeriodKey('2026-W43'));
		expect(t.map(x => [x.line, x.scheduleKey, x.explicit])).toEqual([[1, '2026-W43', false], [5, '2026-10-22', true]]);
		expect(t[0]).toMatchObject({ path: 'Notes/2026-W43.md', raw: '- [ ] Plan budget', text: 'Plan budget', checked: false, doneDate: null });
	});
	test('carries checked and cancelled state', () => {
		const t = extractTasks('x.md', ['- [x] A', '- [-] B', '- [/] C'], [0, 1, 2], null);
		expect(t.map(x => [x.checked, x.cancelled])).toEqual([[true, false], [false, true], [false, false]]);
	});
	test('in progress and priority come from tag rules', () => {
		const t = extractTasks('x.md', ['- [ ] A #in-progress #p2', '- [ ] B', '- [ ] C #p1'], [0, 1, 2], null, [], withTag);
		expect(t.map(x => [x.text, x.inProgress, x.priority])).toEqual([['A #in-progress #p2', true, 2], ['B', false, 0], ['C #p1', false, 3]]);
	});
	test('[/] is in progress only when the marker is in use', () => {
		const lines = ['- [/] A', '- [ ] B #in-progress'];
		expect(extractTasks('x.md', lines, [0, 1], null, [], withTag, true).map(x => x.inProgress)).toEqual([true, true]);
		expect(extractTasks('x.md', lines, [0, 1], null, [], withTag, false).map(x => x.inProgress)).toEqual([false, true]);
		expect(extractTasks('x.md', lines, [0, 1], null, [], DEFAULT_TAG_RULES, true).map(x => x.inProgress)).toEqual([true, false]);
	});
	test('a status tag sets status and wins over [/]', () => {
		const rules = [...withTag, { tag: 'waiting', color: '#0090ff', role: 'status' as const }];
		const t = extractTasks('x.md', ['- [/] A #Waiting', '- [ ] B'], [0, 1], null, [], rules, true);
		expect(t.map(x => [x.status, x.inProgress])).toEqual([['waiting', false], [null, false]]);
	});
	test('lines with other markers are not tasks', () => {
		expect(extractTasks('x.md', ['- [!] A', '- [?] B', '- [ ] C'], [0, 1, 2], null).map(x => x.text)).toEqual(['C']);
	});
	test('[>] is next and [<] is someday', () => {
		const t = extractTasks('x.md', ['- [>] A', '- [<] B'], [0, 1], null);
		expect(t.map(x => [x.next, x.someday])).toEqual([[true, false], [false, true]]);
	});
	test('[>] and [<] are skipped when switched off', () => {
		const lines = ['- [>] A', '- [<] B', '- [ ] C'];
		expect(extractTasks('x.md', lines, [0, 1, 2], null, [], [], false, { next: false, someday: true }).map(x => x.text)).toEqual(['B', 'C']);
		expect(extractTasks('x.md', lines, [0, 1, 2], null, [], [], false, { next: true, someday: false }).map(x => x.text)).toEqual(['A', 'C']);
	});
	test('no rules: tags carry no meaning', () => {
		expect(extractTasks('x.md', ['- [ ] A #p1'], [0], null)[0]).toMatchObject({ priority: 0, inProgress: false });
	});
	test('carries tags and the heading above', () => {
		const t = extractTasks('x.md', ['# H', '- [ ] A #x'], [1], null, [{ line: 0, heading: 'H' }]);
		expect(t[0]).toMatchObject({ text: 'A #x', tags: ['#x'], heading: 'H' });
	});
	test('no headings given: heading is null', () => {
		expect(extractTasks('x.md', ['- [ ] A'], [0], null)[0]?.heading).toBeNull();
	});
	test('non-period note gives undated tasks', () => {
		expect(extractTasks('Work/x.md', ['- [ ] A'], [0], null)[0]?.scheduleKey).toBeNull();
	});
	test('a task under another task is a subtask, at any depth and through plain bullets', () => {
		const lines = ['- [ ] Parent', '\t- [ ] Child', '\t\t- note', '\t\t\t- [ ] Grandchild', '- [ ] Sibling'];
		const parents = new Map([[0, -0], [1, 0], [2, 1], [3, 2], [4, -0]]);
		const t = extractTasks('x.md', lines, [0, 1, 3, 4], null, [], [], false, undefined, parents);
		expect(t.map(x => [x.text, x.subtask])).toEqual([['Parent', false], ['Child', true], ['Grandchild', true], ['Sibling', false]]);
	});
	test('only Klaar tasks are parents', () => {
		const lines = ['- plain', '\t- [ ] A', '- [!] other', '\t- [ ] B'];
		const parents = new Map([[0, -0], [1, 0], [2, -0], [3, 2]]);
		expect(extractTasks('x.md', lines, [1, 2, 3], null, [], [], false, undefined, parents).map(x => x.subtask)).toEqual([false, false]);
	});
	test('no parents given: nothing is a subtask', () => {
		expect(extractTasks('x.md', ['- [ ] A', '\t- [ ] B'], [0, 1], null).map(x => x.subtask)).toEqual([false, false]);
	});
	test('skips listed lines that are not tasks or are out of range', () => {
		expect(extractTasks('x.md', ['plain', '- [ ] A'], [0, 1, 9], null).map(x => x.line)).toEqual([1]);
	});
});

describe('locateTaskLine', () => {
	test('relocate after edits', () => {
		const ref = { line: 1, raw: '- [ ] Plan budget' };
		expect(locateTaskLine(lines, ref)).toBe(1);
		expect(locateTaskLine(['new line', ...lines], ref)).toBe(2);
		expect(locateTaskLine(['- [ ] Plan budget', '- [ ] Plan budget'], { line: 5, raw: '- [ ] Plan budget' })).toBeNull();
		expect(locateTaskLine(['gone'], ref)).toBeNull();
	});
});
