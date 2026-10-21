import { describe, expect, test } from 'vitest';
import { TASK_DRAG_MIME, encodeDragPayload, parseDragPayload } from '../../src/core/dragPayload';

describe('drag payload', () => {
	test('mime constant', () => {
		expect(TASK_DRAG_MIME).toBe('application/x-klaar-task');
	});

	test('round-trips path, line and raw only', () => {
		const ref = { path: 'a/b.md', line: 3, raw: '- [ ] x', checked: false };
		expect(parseDragPayload(encodeDragPayload(ref))).toEqual({ path: 'a/b.md', line: 3, raw: '- [ ] x' });
	});

	test.each(['', 'nope', '{}', '[]', 'null', '{"path":"a","line":"1","raw":"x"}', '{"path":"a","line":1}', '{"path":1,"line":1,"raw":"x"}'])(
		'rejects malformed %j',
		(s) => {
			expect(parseDragPayload(s)).toBeNull();
		},
	);
});
