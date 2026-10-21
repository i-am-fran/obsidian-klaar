import { describe, expect, test } from 'vitest';
import { headingAt, splitTags, tagsOf, withoutTags } from '../../src/core/taskFields';

describe('tagsOf', () => {
	test('finds inline tags in order, without duplicates', () => {
		expect(tagsOf('Ship #work/client-a and #home #work/client-a')).toEqual(['#work/client-a', '#home']);
	});
	test('skips numbers, mid-word hashes and URL fragments', () => {
		expect(tagsOf('Issue #123 a#b https://x.com/#top')).toEqual([]);
	});
	test('a tag with digits after a letter counts', () => {
		expect(tagsOf('#y2026 start')).toEqual(['#y2026']);
	});
});

describe('splitTags', () => {
	test('splits text and tags in order', () => {
		expect(splitTags('#p1 Fix it #bugs now')).toEqual([{ tag: '#p1' }, { text: ' Fix it ' }, { tag: '#bugs' }, { text: ' now' }]);
	});
	test('numbers and mid-word hashes stay text', () => {
		expect(splitTags('Issue #123 a#b')).toEqual([{ text: 'Issue #123 a#b' }]);
	});
});

describe('withoutTags', () => {
	test('dropping every tag tidies the spaces they leave', () => {
		expect(withoutTags('#p1 Fix it #bugs now #123', () => true)).toBe('Fix it now #123');
	});
	test('drops only the tags the predicate picks and tidies the spaces', () => {
		expect(withoutTags('#p1 Fix it #bugs now', (t) => t === '#p1')).toBe('Fix it #bugs now');
	});
	test('dropping nothing keeps the text as written', () => {
		expect(withoutTags('Fix #bugs now', () => false)).toBe('Fix #bugs now');
	});
});

describe('headingAt', () => {
	const hs = [{ line: 2, heading: 'Work' }, { line: 8, heading: 'Home' }];
	test('null above every heading and on the heading line itself', () => {
		expect(headingAt(hs, 1)).toBeNull();
		expect(headingAt(hs, 2)).toBeNull();
	});
	test('nearest heading above the line', () => {
		expect(headingAt(hs, 5)).toBe('Work');
		expect(headingAt(hs, 9)).toBe('Home');
	});
});

