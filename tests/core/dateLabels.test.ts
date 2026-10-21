import { describe, expect, test } from 'vitest';
import { doneLabel, scheduleLabel, scheduleTiming } from '../../src/core/dateLabels';

const today = '2026-10-20';
const friendly = (key: string) => scheduleLabel(key, today, 'friendly', 'en-GB');

describe('scheduleLabel', () => {
	test('days near today read as words', () => {
		expect(friendly('2026-10-20')).toBe('Today');
		expect(friendly('2026-10-21')).toBe('Tomorrow');
		expect(friendly('2026-10-19')).toBe('Yesterday');
	});
	test('other days: weekday, day, month; the year only when it differs', () => {
		expect(friendly('2026-10-23')).toBe('Fri 23 Oct');
		expect(friendly('2027-01-04')).toBe('Mon, 4 Jan 2027');
	});
	test('weeks, months, quarters, years', () => {
		expect(friendly('2026-W43')).toBe('Week 43');
		expect(friendly('2027-W02')).toBe('Week 2, 2027');
		expect(friendly('2026-10')).toBe('Oct 2026');
		expect(friendly('2026-Q4')).toBe('Q4 2026');
		expect(friendly('2026')).toBe('2026');
	});
	test('key style and invalid keys return the key', () => {
		expect(scheduleLabel('2026-10-23', today, 'key', 'en-GB')).toBe('2026-10-23');
		expect(scheduleLabel('nope', today, 'friendly', 'en-GB')).toBe('nope');
	});
});

describe('scheduleTiming', () => {
	test('open tasks: overdue before today, current when the period holds today', () => {
		expect(scheduleTiming('2026-10-19', today, true)).toBe('overdue');
		expect(scheduleTiming('2026-W42', today, true)).toBe('overdue');
		expect(scheduleTiming('2026-10-20', today, true)).toBe('current');
		expect(scheduleTiming('2026-W43', today, true)).toBe('current');
		expect(scheduleTiming('2026-10', today, true)).toBe('current');
		expect(scheduleTiming('2026-10-23', today, true)).toBe('none');
	});
	test('closed tasks and invalid keys are neutral', () => {
		expect(scheduleTiming('2026-10-19', today, false)).toBe('none');
		expect(scheduleTiming('nope', today, true)).toBe('none');
	});
});

describe('doneLabel', () => {
	test('day and month; the year only when it differs', () => {
		expect(doneLabel('2026-10-20', today, 'en-GB')).toBe('20 Oct');
		expect(doneLabel('2025-12-31', today, 'en-GB')).toBe('31 Dec 2025');
	});
});
