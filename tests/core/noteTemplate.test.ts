import { describe, expect, it } from 'vitest';
import { fillTemplate } from '../../src/core/noteTemplate';
import { parsePeriodKey, type Period } from '../../src/core/periods';

function period(key: string): Period {
	const p = parsePeriodKey(key);
	if (!p) throw new Error(`bad key ${key}`);
	return p;
}

const now = new Date('2026-11-03T09:05:00Z');
/** Shows what it was asked to format, so tests see the date and format passed through. */
const format = (date: string | Date, fmt: string) => `${fmt}@${typeof date === 'string' ? date : date.toISOString()}`;

describe('fillTemplate', () => {
	it('fills title with the period key', () => {
		expect(fillTemplate('# {{title}}', period('2026-W45'), now, format)).toBe('# 2026-W45');
	});

	it('fills date with the first day of the period', () => {
		expect(fillTemplate('{{date}}', period('2026-11-03'), now, format)).toBe('2026-11-03');
		expect(fillTemplate('{{date}}', period('2026-W45'), now, format)).toBe('2026-11-02');
		expect(fillTemplate('{{date}}', period('2026-11'), now, format)).toBe('2026-11-01');
		expect(fillTemplate('{{date}}', period('2026-Q4'), now, format)).toBe('2026-10-01');
		expect(fillTemplate('{{date}}', period('2026'), now, format)).toBe('2026-01-01');
	});

	it('formats date and time with a format', () => {
		expect(fillTemplate('{{date:dddd D MMMM}}', period('2026-W45'), now, format)).toBe('dddd D MMMM@2026-11-02');
		expect(fillTemplate('{{time}}', period('2026-W45'), now, format)).toBe(`HH:mm@${now.toISOString()}`);
		expect(fillTemplate('{{time:HH}}', period('2026-W45'), now, format)).toBe(`HH@${now.toISOString()}`);
	});

	it('ignores case and spaces in placeholder names', () => {
		expect(fillTemplate('{{ Title }} {{DATE}}', period('2026-11'), now, format)).toBe('2026-11 2026-11-01');
	});

	it('fills several placeholders across lines', () => {
		const template = '---\ndate: {{date}}\n---\n# {{title}}\n\n## Tasks\n';
		expect(fillTemplate(template, period('2026-11-03'), now, format)).toBe('---\ndate: 2026-11-03\n---\n# 2026-11-03\n\n## Tasks\n');
	});

	it('leaves unknown placeholders and Templater code alone', () => {
		const template = '{{weather}} <% tp.date.now() %> {{date';
		expect(fillTemplate(template, period('2026-11-03'), now, format)).toBe(template);
	});

	it('returns an empty template as is', () => {
		expect(fillTemplate('', period('2026'), now, format)).toBe('');
	});
});
