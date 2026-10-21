import { describe, expect, test } from 'vitest';
import { buildDateOptions, matchDateOptions } from '../../src/core/dateOptions';
import { ALL_PERIODS } from '../../src/core/periods';

const today = '2026-10-19'; // a Monday

describe('dateOptions', () => {
	test('buildDateOptions order', () => {
		const labels = buildDateOptions(today).map((o) => o.label);
		expect(labels).toEqual([
			'Today', 'Tomorrow',
			'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday',
			'This week', 'Next week', 'This month', 'Next month', 'This quarter', 'This year',
		]);
	});

	test('period options', () => {
		const keyOf = (label: string) => buildDateOptions(today).find((o) => o.label === label)?.key;
		expect(keyOf('Today')).toBe('2026-10-19');
		expect(keyOf('This week')).toBe('2026-W43');
		expect(keyOf('This month')).toBe('2026-10');
		expect(keyOf('Next month')).toBe('2026-11');
		expect(keyOf('This quarter')).toBe('2026-Q4');
		expect(keyOf('This year')).toBe('2026');
	});

	test('next month rolls over the year', () => {
		expect(buildDateOptions('2026-12-15').find((o) => o.label === 'Next month')?.key).toBe('2027-01');
	});

	test('prefix queries', () => {
		expect(matchDateOptions('tom', today)[0]).toEqual({ label: 'Tomorrow', key: '2026-10-20' });
		expect(matchDateOptions('next w', today)[0]?.key).toBe('2026-W44');
		expect(matchDateOptions('fri', today)[0]?.key).toBe('2026-10-23');
		expect(matchDateOptions('mon', today)[0]?.key).toBe('2026-10-26');
	});

	test('word-prefix matches come before substring matches', () => {
		const labels = matchDateOptions('th', today).map((o) => o.label);
		expect(labels).toEqual([
			'Thursday', 'This week', 'This month', 'This quarter', 'This year', // word prefix
			'Next month', // substring only
		]);
	});

	test('exact period key comes first', () => {
		expect(matchDateOptions('2026-Q1', today)).toEqual([{ label: '2026-Q1', key: '2026-Q1' }]);
	});

	test('exact period key is case-insensitive', () => {
		expect(matchDateOptions('2026-q1', today)).toEqual([{ label: '2026-Q1', key: '2026-Q1' }]);
		expect(matchDateOptions('2026-w43', today)[0]).toEqual({ label: '2026-W43', key: '2026-W43' });
	});

	test('empty query returns everything, no match returns nothing', () => {
		expect(matchDateOptions('', today)).toEqual(buildDateOptions(today));
		expect(matchDateOptions('zzz', today)).toEqual([]);
	});
});

describe('dateOptions with disabled period kinds', () => {
	test('quarterly off drops "This quarter"', () => {
		const labels = buildDateOptions(today, { ...ALL_PERIODS, quarter: false }).map((o) => o.label);
		expect(labels).not.toContain('This quarter');
		expect(labels).toContain('This year');
	});
	test('daily off drops today, tomorrow and weekdays', () => {
		const labels = buildDateOptions(today, { ...ALL_PERIODS, day: false }).map((o) => o.label);
		expect(labels).toEqual(['This week', 'Next week', 'This month', 'Next month', 'This quarter', 'This year']);
	});
	test('a typed key of a disabled kind is not offered', () => {
		expect(matchDateOptions('2026-Q4', today, { ...ALL_PERIODS, quarter: false })).toEqual([]);
		expect(matchDateOptions('2026-Q4', today)[0]).toEqual({ label: '2026-Q4', key: '2026-Q4' });
	});
});
