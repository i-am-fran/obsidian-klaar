import { describe, expect, test } from 'vitest';
import { DEFAULT_TAG_RULES, type TagRule } from '../../src/core/tagRules';
import { ALL_MARKERS } from '../../src/core/taskLine';
import { sortTaskLists, type SortOptions } from '../../src/core/taskSort';

const sort = (text: string, opts: Partial<SortOptions> = {}) =>
	sortTaskLists(text.split('\n'), { markers: ALL_MARKERS, rules: DEFAULT_TAG_RULES, slashInProgress: true, ...opts })?.join('\n') ?? null;

const withDoing: TagRule[] = [...DEFAULT_TAG_RULES, { tag: 'doing', color: '#000', role: 'in-progress' }];

describe('sortTaskLists', () => {
	test('orders by marker', () => {
		expect(sort('- [-] C\n- [x] D\n- [I] I\n- [?] Q\n- [<] S\n- [ ] T\n- [>] N\n- [/] P')).toBe('- [/] P\n- [>] N\n- [ ] T\n- [<] S\n- [?] Q\n- [I] I\n- [x] D\n- [-] C');
	});

	test('priority breaks ties inside a group', () => {
		expect(sort('- [ ] A\n- [ ] B #p3\n- [ ] C #p1\n- [ ] D #p2')).toBe('- [ ] C #p1\n- [ ] D #p2\n- [ ] B #p3\n- [ ] A');
	});

	test('marker beats priority', () => {
		expect(sort('- [<] S #p1\n- [ ] T')).toBe('- [ ] T\n- [<] S #p1');
	});

	test('done and cancelled ignore priority', () => {
		expect(sort('- [x] A\n- [x] B #p1')).toBe(null);
		expect(sort('- [-] A\n- [-] B #p1')).toBe(null);
	});

	test('ties keep their order and a sorted list is null', () => {
		expect(sort('- [ ] A\n- [ ] B\n- [ ] C')).toBe(null);
		expect(sort('- [/] P\n- [>] N\n- [ ] T\n- [<] S\n- [?] Q\n- [I] I\n- [x] D\n- [-] C')).toBe(null);
	});

	test('subtasks travel with their parent and are not sorted', () => {
		expect(sort('- [x] A\n\t- [ ] A2\n\t- [/] A1\n- [ ] B')).toBe('- [ ] B\n- [x] A\n\t- [ ] A2\n\t- [/] A1');
	});

	test('each list sorts on its own', () => {
		expect(sort('## One\n- [x] A\n- [ ] B\n\n- [x] C\n- [ ] D\n## Two\n- [-] E\n- [ ] F')).toBe('## One\n- [ ] B\n- [x] A\n\n- [ ] D\n- [x] C\n## Two\n- [ ] F\n- [-] E');
	});

	test('plain bullets and paragraphs end a list', () => {
		expect(sort('- [x] A\n- Plain\n- [ ] B')).toBe(null);
		expect(sort('- [x] A\ntext\n- [ ] B')).toBe(null);
	});

	test('slashInProgress off reads [/] as todo', () => {
		expect(sort('- [ ] A\n- [/] B', { slashInProgress: false })).toBe(null);
	});

	test('an in-progress tag counts as in progress', () => {
		expect(sort('- [>] A\n- [ ] B #doing', { rules: withDoing })).toBe('- [ ] B #doing\n- [>] A');
	});

	test('an in-progress tag does not lift a parked or finished task', () => {
		expect(sort('- [ ] A\n- [<] B #doing\n- [x] C #doing', { rules: withDoing })).toBe(null);
	});

	test('leaves code blocks alone', () => {
		expect(sort('```\n- [x] A\n- [ ] B\n```')).toBe(null);
		expect(sort('- [x] A\n```\n- [ ] B\n```')).toBe(null);
	});

	test('keeps CRLF endings', () => {
		expect(sort('- [x] A\r\n- [ ] B\r\n')).toBe('- [ ] B\r\n- [x] A\r\n');
	});

	test('tasks under a plain bullet are not sorted', () => {
		expect(sort('- Plain\n\t- [x] A\n\t- [ ] B')).toBe(null);
	});

	test('last list without a trailing newline', () => {
		expect(sort('# Today\n- [x] A\n- [ ] B')).toBe('# Today\n- [ ] B\n- [x] A');
	});

	test('a marker turned off splits the list', () => {
		expect(sort('- [x] A\n- [ ] B\n- [?] Q\n- [x] C\n- [/] D', { markers: { ...ALL_MARKERS, question: false } })).toBe('- [ ] B\n- [x] A\n- [?] Q\n- [/] D\n- [x] C');
	});
});
