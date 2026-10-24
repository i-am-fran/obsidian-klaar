import { describe, expect, test } from 'vitest';
import { addTag, appendBlock, appendTaskLine, moveDoneToSection, prependBlock, outdentBlock, taskBlockEnd, lineSpans, parseTaskLine, removeDoneStamp, removeTags, reopenTask, setChecked, setInProgressMarker, setOpenMarker, setSchedule, taskMarker, toggleNext, toggleSomeday } from '../../src/core/taskLine';

describe('parseTaskLine', () => {
	test('schedule link must be > plus a valid period', () => {
		expect(parseTaskLine('- [ ] Call Sam >[[2026-10-23]]')!.scheduleKey).toBe('2026-10-23');
		expect(parseTaskLine('- [ ] Plan >[[2026-W43]]')!.scheduleKey).toBe('2026-W43');
		expect(parseTaskLine('- [ ] See [[2026-10-23]]')!.scheduleKey).toBeNull();
		expect(parseTaskLine('- [ ] Read >[[Meeting notes]]')!.scheduleKey).toBeNull();
		expect(parseTaskLine('- [ ] A >[[2026-10-01]] then >[[2026-10-23]]')!.scheduleKey).toBe('2026-10-23');
		expect(parseTaskLine('Just text')).toBeNull();
	});

	test('earlier schedule links are not left in the text', () => {
		expect(parseTaskLine('- [ ] A >[[2026-10-01]] then >[[2026-10-23]]')).toMatchObject({ text: 'A then', scheduleKey: '2026-10-23' });
	});

	test('reads checked state, text and done stamp', () => {
		expect(parseTaskLine('- [ ] Open')).toEqual({ checked: false, cancelled: false, inProgress: false, next: false, someday: false, text: 'Open', scheduleKey: null, doneDate: null });
		expect(parseTaskLine('  * [x] Done >[[2026-10-23]] (@done [[2026-10-19]])')).toEqual({
			checked: true,
			cancelled: false,
			inProgress: false,
			next: false,
			someday: false,
			text: 'Done',
			scheduleKey: '2026-10-23',
			doneDate: '2026-10-19',
		});
	});

	test('only x or X is checked; - is cancelled; / is in progress', () => {
		expect(parseTaskLine('- [X] Upper')).toMatchObject({ checked: true, cancelled: false, inProgress: false });
		expect(parseTaskLine('+ [-] Cancelled')).toMatchObject({ checked: false, cancelled: true, inProgress: false });
		expect(parseTaskLine('- [/] Started')).toMatchObject({ checked: false, cancelled: false, inProgress: true });
	});

	test('> is next; < is someday', () => {
		expect(parseTaskLine('- [>] Soon')).toMatchObject({ checked: false, cancelled: false, inProgress: false, next: true, someday: false });
		expect(parseTaskLine('- [<] Later')).toMatchObject({ checked: false, cancelled: false, next: false, someday: true });
	});

	test('a > or < marker that is switched off is not a task', () => {
		expect(parseTaskLine('- [>] Soon', { next: false, someday: true })).toBeNull();
		expect(parseTaskLine('- [<] Later', { next: true, someday: false })).toBeNull();
		expect(parseTaskLine('- [ ] Plain', { next: false, someday: false })).not.toBeNull();
	});

	test('any other marker is not a task', () => {
		for (const m of ['!', '?', '*']) expect(parseTaskLine(`- [${m}] Other`)).toBeNull();
	});
});

describe('setSchedule', () => {
	test('replaces the last valid link, or appends', () => {
		expect(setSchedule('- [ ] Plan', '2026-W43')).toBe('- [ ] Plan >[[2026-W43]]');
		expect(setSchedule('- [ ] Plan (@done [[2026-10-19]])', '2026-W43')).toBe('- [ ] Plan >[[2026-W43]] (@done [[2026-10-19]])');
		expect(setSchedule('  - [ ] Nested >[[2026-10-23]]', null)).toBe('  - [ ] Nested');
	});

	test('keeps a single schedule link: earlier valid links are removed', () => {
		expect(setSchedule('- [ ] A >[[2026-10-01]] then >[[2026-10-23]]', '2026-10-24')).toBe('- [ ] A then >[[2026-10-24]]');
		expect(setSchedule('- [ ] >[[2026-10-01]] A >[[2026-10-23]]', '2026-10-24')).toBe('- [ ] A >[[2026-10-24]]');
		expect(setSchedule('- [ ] A >[[2026-10-01]] >[[2026-10-23]]', null)).toBe('- [ ] A');
		expect(setSchedule('- [ ] A >[[Notes]] >[[2026-10-01]] >[[2026-10-23]]', '2026-10-24')).toBe('- [ ] A >[[Notes]] >[[2026-10-24]]');
	});

	test('leaves non-task lines alone and ignores invalid links', () => {
		expect(setSchedule('Just text', '2026-10-23')).toBe('Just text');
		expect(setSchedule('- [ ] Read >[[Meeting notes]]', '2026-10-23')).toBe('- [ ] Read >[[Meeting notes]] >[[2026-10-23]]');
	});
});

describe('setChecked', () => {
	test('done stamp is idempotent', () => {
		const ticked = setChecked('- [ ] Ship it', true, '2026-10-19', true);
		expect(ticked).toBe('- [x] Ship it (@done [[2026-10-19]])');
		expect(setChecked(ticked, true, '2026-10-20', true)).toBe(ticked);
		expect(setChecked(ticked, false, '2026-10-20', true)).toBe('- [ ] Ship it');
		expect(setChecked('- [ ] Ship it', true, '2026-10-19', false)).toBe('- [x] Ship it');
	});

	test('checking any non-x marker sets x; X stays X', () => {
		expect(setChecked('- [/] Started', true, '2026-10-19', false)).toBe('- [x] Started');
		expect(setChecked('- [X] Upper', true, '2026-10-19', true)).toBe('- [X] Upper (@done [[2026-10-19]])');
	});

	test('keeps indentation and marker', () => {
		expect(setChecked('\t* [ ] Nested', true, '2026-10-19', true)).toBe('\t* [x] Nested (@done [[2026-10-19]])');
	});
});

describe('CRLF lines', () => {
	test('parse ignores a trailing \\r', () => {
		expect(parseTaskLine('- [x] Done >[[2026-10-23]] (@done [[2026-10-19]])\r')).toMatchObject({
			text: 'Done',
			scheduleKey: '2026-10-23',
			doneDate: '2026-10-19',
		});
	});
	test('setSchedule keeps the trailing \\r', () => {
		expect(setSchedule('- [ ] Plan\r', '2026-W43')).toBe('- [ ] Plan >[[2026-W43]]\r');
		expect(setSchedule('- [ ] Plan >[[2026-10-23]]\r', '2026-10-24')).toBe('- [ ] Plan >[[2026-10-24]]\r');
		expect(setSchedule('- [ ] Plan >[[2026-10-23]]\r', null)).toBe('- [ ] Plan\r');
		expect(setSchedule('- [ ] Plan (@done [[2026-10-19]])\r', '2026-W43')).toBe('- [ ] Plan >[[2026-W43]] (@done [[2026-10-19]])\r');
	});
	test('setChecked keeps the trailing \\r', () => {
		const ticked = setChecked('- [ ] Ship it\r', true, '2026-10-19', true);
		expect(ticked).toBe('- [x] Ship it (@done [[2026-10-19]])\r');
		expect(setChecked(ticked, true, '2026-10-20', true)).toBe(ticked);
		expect(setChecked(ticked, false, '2026-10-20', true)).toBe('- [ ] Ship it\r');
		expect(setChecked('- [ ] Ship it\r', true, '2026-10-19', false)).toBe('- [x] Ship it\r');
	});
});

describe('removeDoneStamp', () => {
	test('drops the stamp and keeps the marker', () => {
		expect(removeDoneStamp('- [ ] A >[[2026-10-23]] (@done [[2026-10-19]])')).toBe('- [ ] A >[[2026-10-23]]');
		expect(removeDoneStamp('- [/] A (@done [[2026-10-19]])')).toBe('- [/] A');
	});
	test('keeps the trailing \\r', () => {
		expect(removeDoneStamp('- [ ] A (@done [[2026-10-19]])\r')).toBe('- [ ] A\r');
	});
	test('lines without a stamp and non-task lines are unchanged', () => {
		expect(removeDoneStamp('- [ ] A')).toBe('- [ ] A');
		expect(removeDoneStamp('Just text (@done [[2026-10-19]])')).toBe('Just text (@done [[2026-10-19]])');
	});
});

describe('markers are plain text', () => {
	test('!!! and >> stay in the text', () => {
		expect(parseTaskLine('- [ ] >> !! Ship it')).toMatchObject({ text: '>> !! Ship it' });
	});
});

describe('addTag', () => {
	test('goes at the end of the text, before the schedule link and stamp', () => {
		expect(addTag('- [ ] Ship it', 'p1')).toBe('- [ ] Ship it #p1');
		expect(addTag('- [ ] Ship it >[[2026-10-23]]', '#p1')).toBe('- [ ] Ship it #p1 >[[2026-10-23]]');
		expect(addTag('\t* [x] A (@done [[2026-10-19]])\r', 'p1')).toBe('\t* [x] A #p1 (@done [[2026-10-19]])\r');
		expect(addTag('- [ ] ', 'p1')).toBe('- [ ] #p1');
	});
	test('already there (any case) or not a task: unchanged', () => {
		expect(addTag('- [ ] A #P1', 'p1')).toBe('- [ ] A #P1');
		expect(addTag('Just text', 'p1')).toBe('Just text');
	});
});

describe('removeTags', () => {
	test('removes whole tags only, any case, with their space', () => {
		expect(removeTags('- [ ] #p1 A #P1 #p10 #p1/x >[[2026-10-23]]', ['p1'])).toBe('- [ ] A #p10 #p1/x >[[2026-10-23]]');
		expect(removeTags('- [ ] A #p2 #bugs', ['#p2', 'bugs'])).toBe('- [ ] A');
	});
	test('not a task: unchanged', () => {
		expect(removeTags('Just #p1', ['p1'])).toBe('Just #p1');
	});
});

describe('lineSpans', () => {
	test('offsets of valid schedule links and the done stamp', () => {
		const line = '  - [x] A >[[2026-10-23]] see [[Note]] (@done [[2026-10-20]])';
		const spans = lineSpans(line);
		expect(spans.schedule.map(s => [line.slice(s.from, s.to), s.key])).toEqual([['>[[2026-10-23]]', '2026-10-23']]);
		expect(spans.done && [line.slice(spans.done.from, spans.done.to), spans.done.date]).toEqual(['(@done [[2026-10-20]])', '2026-10-20']);
	});
	test('every valid schedule link counts; no stamp gives null', () => {
		const line = '- [ ] A >[[2026-10-01]] then >[[2026-W43]] >[[Meeting]]';
		expect(lineSpans(line).schedule.map(s => line.slice(s.from, s.to))).toEqual(['>[[2026-10-01]]', '>[[2026-W43]]']);
		expect(lineSpans(line).done).toBeNull();
	});
	test('non-task lines have none', () => {
		expect(lineSpans('Just >[[2026-10-23]]')).toEqual({ schedule: [], done: null });
	});
});

describe('unknown markers are left alone', () => {
	test('rewrites return the line unchanged', () => {
		expect(setSchedule('- [!] A', '2026-10-23')).toBe('- [!] A');
		expect(setChecked('- [!] A', true, '2026-10-21', true)).toBe('- [!] A');
		expect(addTag('- [!] A', 'p1')).toBe('- [!] A');
		expect(lineSpans('- [?] A >[[2026-10-23]]')).toEqual({ schedule: [], done: null });
	});
});

describe('next and someday markers', () => {
	test('toggleNext switches [ ] and [>]', () => {
		expect(toggleNext('- [ ] A')).toBe('- [>] A');
		expect(toggleNext('- [>] A')).toBe('- [ ] A');
	});
	test('toggleNext from any other state gives [>]', () => {
		expect(toggleNext('- [/] A')).toBe('- [>] A');
		expect(toggleNext('- [<] A')).toBe('- [>] A');
		expect(toggleNext('- [-] A')).toBe('- [>] A');
		expect(toggleNext('- [x] A >[[2026-10-21]] (@done [[2026-10-21]])')).toBe('- [>] A >[[2026-10-21]]');
	});
	test('toggleSomeday switches [ ] and [<]', () => {
		expect(toggleSomeday('- [ ] A')).toBe('- [<] A');
		expect(toggleSomeday('- [<] A')).toBe('- [ ] A');
		expect(toggleSomeday('- [>] A\r')).toBe('- [<] A\r');
		expect(toggleSomeday('- [X] A (@done [[2026-10-21]])')).toBe('- [<] A');
	});
	test('toggles leave non-task lines alone', () => {
		expect(toggleNext('- [!] A')).toBe('- [!] A');
		expect(toggleSomeday('Text')).toBe('Text');
	});
	test('reopenTask turns someday into [ ] and leaves next alone', () => {
		expect(reopenTask('- [<] A')).toBe('- [ ] A');
		expect(reopenTask('- [>] A')).toBe('- [>] A');
	});
	test('setOpenMarker only swaps unfinished markers', () => {
		expect(setOpenMarker('- [/] A', '<')).toBe('- [<] A');
		expect(setOpenMarker('- [x] A', '>')).toBe('- [x] A');
	});
	test('setInProgressMarker off leaves [>] and [<] alone', () => {
		expect(setInProgressMarker('- [>] A', false)).toBe('- [>] A');
		expect(setInProgressMarker('- [<] A', true)).toBe('- [/] A');
	});
	test('ticking [>] or [<] gives [x]', () => {
		expect(setChecked('- [>] A', true, '2026-10-21', false)).toBe('- [x] A');
		expect(setChecked('- [<] A', true, '2026-10-21', false)).toBe('- [x] A');
	});
});

describe('in progress marker', () => {
	test('ticking [/] gives [x] and the stamp', () => {
		expect(setChecked('- [/] A', true, '2026-10-21', true)).toBe('- [x] A (@done [[2026-10-21]])');
	});
	test('setInProgressMarker turns an open task on and off', () => {
		expect(setInProgressMarker('- [ ] A', true)).toBe('- [/] A');
		expect(setInProgressMarker('- [/] A', true)).toBe('- [/] A');
		expect(setInProgressMarker('- [/] A', false)).toBe('- [ ] A');
		expect(setInProgressMarker('- [ ] A', false)).toBe('- [ ] A');
	});
	test('setInProgressMarker leaves done, cancelled and non-task lines alone', () => {
		expect(setInProgressMarker('- [x] A (@done [[2026-10-01]])', true)).toBe('- [x] A (@done [[2026-10-01]])');
		expect(setInProgressMarker('- [-] A', true)).toBe('- [-] A');
		expect(setInProgressMarker('Just text', true)).toBe('Just text');
	});
	test('keeps CRLF', () => expect(setInProgressMarker('- [ ] A\r', true)).toBe('- [/] A\r'));
});

describe('reopenTask', () => {
	test('unticks done and cancelled tasks, dropping the stamp', () => {
		expect(reopenTask('- [x] A (@done [[2026-10-01]])')).toBe('- [ ] A');
		expect(reopenTask('- [-] A')).toBe('- [ ] A');
	});
	test('open tasks and non-task lines are unchanged', () => {
		expect(reopenTask('- [/] A')).toBe('- [/] A');
		expect(reopenTask('- [ ] A ')).toBe('- [ ] A ');
		expect(reopenTask('Just text')).toBe('Just text');
	});
});

describe('taskMarker', () => {
	test('the character between the brackets', () => {
		expect(taskMarker('- [ ] A')).toBe(' ');
		expect(taskMarker('  * [/] A')).toBe('/');
		expect(taskMarker('- [X] A (@done [[2026-10-01]])')).toBe('X');
		expect(taskMarker('- [-] A')).toBe('-');
	});
	test('null for non-task lines and unknown markers', () => {
		expect(taskMarker('Just text')).toBeNull();
		expect(taskMarker('- [!] A')).toBeNull();
	});
});

describe('appendTaskLine', () => {
	test('adds an open task on its own line at the end', () => {
		expect(appendTaskLine('', 'Call Sam')).toBe('- [ ] Call Sam\n');
		expect(appendTaskLine('# Notes\n', 'Call Sam')).toBe('# Notes\n- [ ] Call Sam\n');
		expect(appendTaskLine('# Notes', 'Call Sam')).toBe('# Notes\n- [ ] Call Sam\n');
	});

	test('trims the text', () => {
		expect(appendTaskLine('', '  Call Sam  ')).toBe('- [ ] Call Sam\n');
	});
});

describe('taskBlockEnd', () => {
	const lines = ['- [ ] Trip', '\t- [ ] Book', '    - [ ] Pack', '  Notes', '- [ ] Next', '', '\t- [ ] After blank'];
	test('takes the lines indented further, up to the next sibling', () => {
		expect(taskBlockEnd(lines, 0)).toBe(4);
		expect(taskBlockEnd(lines, 1)).toBe(2);
	});
	test('stops at a blank line and at the end', () => {
		expect(taskBlockEnd(lines, 4)).toBe(5);
		expect(taskBlockEnd(lines, 6)).toBe(7);
	});
});

describe('outdentBlock', () => {
	test("strips the top task's indentation from every line", () => {
		expect(outdentBlock(['\t- [ ] Book', '\t\t- [ ] Train', '\tNote'])).toEqual(['- [ ] Book', '\t- [ ] Train', 'Note']);
		expect(outdentBlock(['- [ ] Trip', '\t- [ ] Book'])).toEqual(['- [ ] Trip', '\t- [ ] Book']);
	});
});

describe('appendBlock', () => {
	test('adds the lines at the end, on lines of their own', () => {
		expect(appendBlock('', ['- [ ] A', '\t- [ ] B'])).toBe('- [ ] A\n\t- [ ] B\n');
		expect(appendBlock('# Notes', ['- [ ] A'])).toBe('# Notes\n- [ ] A\n');
		expect(appendBlock('# Notes\n', ['- [ ] A'])).toBe('# Notes\n- [ ] A\n');
	});
});

describe('prependBlock', () => {
	test('adds the lines at the start, on lines of their own', () => {
		expect(prependBlock('', ['- [ ] A', '\t- [ ] B'])).toBe('- [ ] A\n\t- [ ] B\n');
		expect(prependBlock('# Notes\n- [ ] B\n', ['- [ ] A'])).toBe('- [ ] A\n# Notes\n- [ ] B\n');
	});

	test('goes after the frontmatter', () => {
		expect(prependBlock('---\ntags: x\n---\n# Notes\n', ['- [ ] A'])).toBe('---\ntags: x\n---\n- [ ] A\n# Notes\n');
		expect(prependBlock('---\ntags: x\n---', ['- [ ] A'])).toBe('---\ntags: x\n---\n- [ ] A\n');
	});

	test('a note with an unclosed --- has no frontmatter', () => {
		expect(prependBlock('---\nnot closed\n', ['- [ ] A'])).toBe('- [ ] A\n---\nnot closed\n');
	});
});

describe('moveDoneToSection', () => {
	const move = (text: string) => moveDoneToSection(text.split('\n'))?.join('\n') ?? null;

	test('creates ## Done at the end and moves done tasks there, in order, with their subtasks', () => {
		expect(move('# Today\n- [x] A\n\t- [ ] A1\n- [ ] B\n- [X] C\n')).toBe('# Today\n- [ ] B\n\n## Done\n- [x] A\n\t- [ ] A1\n- [X] C\n');
	});

	test('adds to the end of an existing ## Done section, before the next heading', () => {
		expect(move('- [x] A\n- [ ] B\n\n## Done\n- [x] Old\n\n## Notes\ntext\n')).toBe('- [ ] B\n\n## Done\n- [x] Old\n- [x] A\n\n## Notes\ntext\n');
		expect(move('## done\n- [x] Old\n### Sub\n- [x] S\n- [x] A')).toBe(null);
	});

	test('leaves tasks already under ## Done, open, cancelled and nested done tasks alone', () => {
		expect(move('- [ ] A\n\t- [x] A1\n- [-] B\n\n## Done\n- [x] Old\n')).toBe(null);
		expect(move('- [ ] A\n')).toBe(null);
	});

	test('skips tasks in code blocks', () => {
		expect(move('```\n- [x] code\n```\n- [ ] A\n')).toBe(null);
	});

	test('a note without a trailing newline', () => {
		expect(move('- [x] A\n- [ ] B')).toBe('- [ ] B\n\n## Done\n- [x] A');
	});
});
