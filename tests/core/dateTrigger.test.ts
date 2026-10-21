import { describe, expect, test } from 'vitest';
import { findDateTrigger } from '../../src/core/dateTrigger';

describe('findDateTrigger', () => {
	test('bare > after a space', () => {
		expect(findDateTrigger('- [ ] buy milk >')).toEqual({ start: 15, query: '' });
	});
	test('captures the query', () => {
		expect(findDateTrigger('- [ ] buy milk >tom')).toEqual({ start: 15, query: 'tom' });
		expect(findDateTrigger('- [ ] x >next w')).toEqual({ start: 8, query: 'next w' });
		expect(findDateTrigger('- [ ] x >2026-W43')).toEqual({ start: 8, query: '2026-W43' });
	});
	test('> at the line start', () => {
		expect(findDateTrigger('>to')).toEqual({ start: 0, query: 'to' });
	});
	test('ignores arrows and non-whitespace predecessors', () => {
		expect(findDateTrigger('- [ ] a ->')).toBeNull();
		expect(findDateTrigger('- [ ] a =>')).toBeNull();
		expect(findDateTrigger('- [ ] a>b')).toBeNull();
		expect(findDateTrigger('- [ ] >>')).toBeNull();
		expect(findDateTrigger('- [ ] >> Ship')).toBeNull();
	});
	test('ignores a finished link', () => {
		expect(findDateTrigger('- [ ] a >[[2026-10-20]]')).toBeNull();
		expect(findDateTrigger('- [ ] a >[[')).toBeNull();
	});
	test('does not fire when [[ follows the cursor', () => {
		expect(findDateTrigger('- [ ] a >', '[[2026-10-20]]')).toBeNull();
		expect(findDateTrigger('- [ ] a >', ' more')).toEqual({ start: 8, query: '' });
	});
	test('query is limited to 20 characters', () => {
		expect(findDateTrigger('- [ ] a >' + 'a'.repeat(20))?.query).toHaveLength(20);
		expect(findDateTrigger('- [ ] a >' + 'a'.repeat(21))).toBeNull();
	});
	test('ignores prose with a spaced >', () => {
		expect(findDateTrigger('- [ ] a > b')).toBeNull();
		expect(findDateTrigger('- [ ] a > ')).toBeNull();
	});
	test('rejects other punctuation in the query', () => {
		expect(findDateTrigger('- [ ] a >to!')).toBeNull();
	});
	test('uses the last > on the line', () => {
		expect(findDateTrigger('- [ ] a >[[2026-10-20]] b >fr')).toEqual({ start: 26, query: 'fr' });
	});
});
