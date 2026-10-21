import { describe, expect, test } from 'vitest';
import { monthGrid } from '../../src/core/monthGrid';

describe('monthGrid', () => {
	test('October 2026 starts with week 40 on 2026-09-28', () => {
		const rows = monthGrid(2026, 10);
		expect(rows).toHaveLength(5);
		expect(rows[0]?.weekKey).toBe('2026-W40');
		expect(rows[0]?.weekNumber).toBe(40);
		expect(rows[0]?.days[0]).toEqual({ date: '2026-09-28', inMonth: false });
		expect(rows[0]?.days[3]).toEqual({ date: '2026-10-01', inMonth: true });
		expect(rows[4]?.days[6]).toEqual({ date: '2026-11-01', inMonth: false });
		expect(rows[3]?.weekKey).toBe('2026-W43');
	});

	test('a month starting on Monday has no leading days', () => {
		const rows = monthGrid(2026, 6); // 2026-06-01 is a Monday
		expect(rows[0]?.days[0]).toEqual({ date: '2026-06-01', inMonth: true });
		expect(rows.every((r) => r.days.length === 7)).toBe(true);
		expect(rows[4]?.days[1]).toEqual({ date: '2026-06-30', inMonth: true });
		expect(rows[4]?.days[2]?.inMonth).toBe(false);
	});

	test('a month ending on Sunday has no trailing row', () => {
		const rows = monthGrid(2026, 5); // 2026-05-31 is a Sunday
		expect(rows).toHaveLength(5);
		expect(rows[rows.length - 1]?.days[6]).toEqual({ date: '2026-05-31', inMonth: true });
	});

	test('January uses the ISO year of the week', () => {
		expect(monthGrid(2027, 1)[0]?.weekKey).toBe('2026-W53');
	});
});
