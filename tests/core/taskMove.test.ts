import { describe, expect, test } from 'vitest';
import { blockAt, blockForPeriodNote, blocksForLines, findBlock, insertLines, openTopLevelBlocks, removeLines } from '../../src/core/taskMove';

const note = ['# Day', '- [ ] Call Sam >[[2026-08-14]]', '\t- [x] Find number', '\t- [ ] Book table', '- [ ] Other', ''];

describe('blockAt', () => {
	test('the task line with its subtasks', () => {
		expect(blockAt(note, { line: 1, raw: note[1] as string })).toEqual({ start: 1, end: 4, lines: note.slice(1, 4) });
	});

	test('finds the task when it has moved to another line', () => {
		expect(blockAt(['', ...note], { line: 1, raw: note[1] as string })?.start).toBe(2);
	});

	test('null when the task is gone', () => {
		expect(blockAt(note, { line: 1, raw: '- [ ] Missing' })).toBeNull();
	});
});

describe('blockForPeriodNote', () => {
	test('drops the schedule link and outdents, keeping subtasks', () => {
		expect(blockForPeriodNote(['\t- [ ] Call Sam >[[2026-08-14]]', '\t\t- [ ] Book table >[[2026-08-15]]'])).toEqual([
			'- [ ] Call Sam',
			'\t- [ ] Book table >[[2026-08-15]]',
		]);
	});

	test('keeps the done stamp and other text', () => {
		expect(blockForPeriodNote(['- [ ] Pay #p1 >[[2026-W36]] now'])).toEqual(['- [ ] Pay #p1 now']);
	});
});

describe('removeLines and insertLines', () => {
	test('round-trip', () => {
		const removed = removeLines(note, 1, 4);
		expect(removed).toEqual(['# Day', '- [ ] Other', '']);
		expect(insertLines(removed, 1, note.slice(1, 4))).toEqual(note);
	});

	test('insert past the end appends', () => {
		expect(insertLines(['a'], 5, ['b'])).toEqual(['a', 'b']);
	});
});

describe('findBlock', () => {
	test('index of an exact, unique run of lines', () => {
		expect(findBlock(note, ['- [ ] Other'])).toBe(4);
		expect(findBlock(note, note.slice(1, 3))).toBe(1);
	});

	test('null when missing or ambiguous', () => {
		expect(findBlock(note, ['- [ ] Nope'])).toBeNull();
		expect(findBlock(['- [ ] A', '- [ ] A'], ['- [ ] A'])).toBeNull();
		expect(findBlock(note, [])).toBeNull();
	});
});

describe('blocksForLines', () => {
	test('one block per selected top task, subtasks folded into their parent', () => {
		expect(blocksForLines(note, [1, 2, 3, 4]).map((b) => [b.start, b.end])).toEqual([
			[1, 4],
			[4, 5],
		]);
	});

	test('a selected subtask on its own is its own block; non-task lines are skipped', () => {
		expect(blocksForLines(note, [0, 3]).map((b) => [b.start, b.end])).toEqual([[3, 4]]);
	});
});

describe('openTopLevelBlocks', () => {
	test('open top-level tasks with their subtasks; done, cancelled, someday, question, idea and fenced ones stay', () => {
		const lines = [
			'- [ ] Open',
			'\t- [x] Done child',
			'- [x] Done',
			'- [-] Cancelled',
			'- [<] Someday',
			'- [?] Question',
			'- [I] Idea',
			'- [/] Started',
			'```',
			'- [ ] In code',
			'```',
			'\t- [ ] Nested alone',
		];
		expect(openTopLevelBlocks(lines).map((b) => [b.start, b.end])).toEqual([
			[0, 2],
			[7, 8],
		]);
	});
});
