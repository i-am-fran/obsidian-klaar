import { describe, expect, test } from 'vitest';
import { linkKind, parseInline } from '../../src/core/inlineMarkdown';

describe('parseInline', () => {
	test('plain text is one run', () => {
		expect(parseInline('Enable git plugin')).toEqual([{ text: 'Enable git plugin' }]);
	});
	test('italic, bold, strikethrough and highlight', () => {
		expect(parseInline('a *b* _c_ **d** __e__ ~~f~~ ==g==')).toEqual([
			{ text: 'a ' },
			{ style: 'em', children: [{ text: 'b' }] },
			{ text: ' ' },
			{ style: 'em', children: [{ text: 'c' }] },
			{ text: ' ' },
			{ style: 'strong', children: [{ text: 'd' }] },
			{ text: ' ' },
			{ style: 'strong', children: [{ text: 'e' }] },
			{ text: ' ' },
			{ style: 'strike', children: [{ text: 'f' }] },
			{ text: ' ' },
			{ style: 'mark', children: [{ text: 'g' }] },
		]);
	});
	test('styles nest', () => {
		expect(parseInline('*a **b** c*')).toEqual([
			{ style: 'em', children: [{ text: 'a ' }, { style: 'strong', children: [{ text: 'b' }] }, { text: ' c' }] },
		]);
	});
	test('inline code is literal', () => {
		expect(parseInline('Import `~/*Notes*` now')).toEqual([{ text: 'Import ' }, { code: '~/*Notes*' }, { text: ' now' }]);
	});
	test('unclosed, empty, space-padded and intraword underscores stay text', () => {
		expect(parseInline('2 * 3 * 4')).toEqual([{ text: '2 * 3 * 4' }]);
		expect(parseInline('a ** b and *open')).toEqual([{ text: 'a ** b and *open' }]);
		expect(parseInline('snake_case_name')).toEqual([{ text: 'snake_case_name' }]);
		expect(parseInline('`open')).toEqual([{ text: '`open' }]);
	});
	test('a backslash escapes punctuation', () => {
		expect(parseInline('\\*not italic\\*')).toEqual([{ text: '*not italic*' }]);
	});
	test('tags become tag runs, also inside styles', () => {
		expect(parseInline('#p1 Fix *it #bugs*')).toEqual([
			{ tag: '#p1' },
			{ text: ' Fix ' },
			{ style: 'em', children: [{ text: 'it ' }, { tag: '#bugs' }] },
		]);
	});
	test('wikilinks: target as written, alias as label, heading kept', () => {
		expect(parseInline('Review [[Skill matrix]] and [[Notes/Plan#Goals|the plan]].')).toEqual([
			{ text: 'Review ' },
			{ link: 'Skill matrix', label: 'Skill matrix' },
			{ text: ' and ' },
			{ link: 'Notes/Plan#Goals', label: 'the plan' },
			{ text: '.' },
		]);
	});
	test('a wikilink is not split by tags or styles inside it', () => {
		expect(parseInline('*[[a_b_c#h]]*')).toEqual([{ style: 'em', children: [{ link: 'a_b_c#h', label: 'a_b_c#h' }] }]);
	});
	test('markdown links keep their url', () => {
		expect(parseInline('See [docs](https://x.com/a_b) and [note](Plan.md)')).toEqual([
			{ text: 'See ' },
			{ url: 'https://x.com/a_b', label: 'docs' },
			{ text: ' and ' },
			{ url: 'Plan.md', label: 'note' },
		]);
	});
	test('a link with a blocked scheme is just its label', () => {
		expect(parseInline('see [docs](javascript:alert%281%29) and [f](file:///etc/passwd)')).toEqual([{ text: 'see docs and f' }]);
		expect(parseInline('[fix #p1](data:text/html,x)')).toEqual([{ text: 'fix ' }, { tag: '#p1' }]);
	});
	test('empty or unclosed brackets stay text', () => {
		expect(parseInline('[[]] and [[open and [x](')).toEqual([{ text: '[[]] and [[open and [x](' }]);
	});
});

describe('linkKind', () => {
	test('web, mail and obsidian links are external', () => {
		for (const url of ['https://x.com', 'http://x.com', 'HTTPS://X.COM', 'mailto:a@b.c', 'obsidian://open?vault=v']) {
			expect(linkKind(url)).toBe('external');
		}
	});
	test('a path without a scheme is internal', () => {
		expect(linkKind('Plan.md')).toBe('internal');
		expect(linkKind('My%20Note.md#h')).toBe('internal');
	});
	test('any other scheme is not a link', () => {
		for (const url of ['javascript:alert%281%29', 'JavaScript:x', 'data:text/html,x', 'file:///etc/passwd', 'vbscript:x', '%6Aavascript:x', 'java%73cript:x']) {
			expect(linkKind(url)).toBe('blocked');
		}
	});
});
