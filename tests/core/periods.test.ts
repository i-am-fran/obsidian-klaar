import { describe, expect, test } from 'vitest';
import { addDays, todayIso, weekday } from '../../src/core/dates';
import { ALL_PERIODS, adjacentPeriod, childKindIn, contains, isoWeek, parsePeriodKey, parentKind, periodOf } from '../../src/core/periods';

describe('periods', () => {
	test('iso week boundaries', () => {
		expect(periodOf('week', '2026-12-31').key).toBe('2026-W53');
		expect(periodOf('week', '2027-01-01').key).toBe('2026-W53');
		expect(periodOf('week', '2024-12-30').key).toBe('2025-W01');
		expect(periodOf('week', '2026-10-19').key).toBe('2026-W43');
	});
	test('parse keys', () => {
		expect(parsePeriodKey('2026-W43')).toMatchObject({ kind: 'week', start: '2026-10-19', end: '2026-10-25' });
		expect(parsePeriodKey('2026-Q4')).toMatchObject({ kind: 'quarter', start: '2026-10-01', end: '2026-12-31' });
		expect(parsePeriodKey('2026-10')).toMatchObject({ kind: 'month', end: '2026-10-31' });
		expect(parsePeriodKey('2026')).toMatchObject({ kind: 'year', start: '2026-01-01', end: '2026-12-31' });
		expect(parsePeriodKey('2025-W53')).toBeNull();
		expect(parsePeriodKey('2026-02-30')).toBeNull();
		expect(parsePeriodKey('Meeting notes')).toBeNull();
	});
	test('adjacent periods', () => {
		const day = parsePeriodKey('2026-12-31')!;
		expect(adjacentPeriod('day', day, 1).key).toBe('2027-01-01');
		expect(adjacentPeriod('day', day, -1).key).toBe('2026-12-30');
		expect(adjacentPeriod('week', day, 1).key).toBe('2027-W01');
		expect(adjacentPeriod('week', parsePeriodKey('2026-01-01')!, -1).key).toBe('2025-W52');
		expect(adjacentPeriod('month', day, 1).key).toBe('2027-01');
		expect(adjacentPeriod('month', parsePeriodKey('2026-01')!, -1).key).toBe('2025-12');
		expect(adjacentPeriod('quarter', day, 1).key).toBe('2027-Q1');
		expect(adjacentPeriod('quarter', parsePeriodKey('2026-Q1')!, -1).key).toBe('2025-Q4');
		expect(adjacentPeriod('year', day, -1).key).toBe('2025');
		// Week 27 starts on Monday 29 June, but its Thursday is in July.
		expect(adjacentPeriod('month', parsePeriodKey('2026-W27')!, 1).key).toBe('2026-08');
	});
	test('containment', () => {
		expect(contains(parsePeriodKey('2026-W43')!, parsePeriodKey('2026-10-22')!)).toBe(true);
		expect(contains(parsePeriodKey('2026-10')!, parsePeriodKey('2026-W44')!)).toBe(true); // Thu 2026-10-29
		expect(contains(parsePeriodKey('2026-11')!, parsePeriodKey('2026-W44')!)).toBe(false);
	});
	test('isoWeek, periodOf for other kinds', () => {
		expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
		expect(periodOf('quarter', '2026-11-15').key).toBe('2026-Q4');
		expect(periodOf('month', '2024-02-10').end).toBe('2024-02-29');
		expect(periodOf('day', '2026-10-19')).toMatchObject({ start: '2026-10-19', end: '2026-10-19' });
	});
	test('week rolls up by Thursday across month edges', () => {
		// 2026-W53 is Dec 28 - Jan 3, Thursday is Dec 31
		expect(contains(parsePeriodKey('2026-12')!, parsePeriodKey('2026-W53')!)).toBe(true);
		expect(contains(parsePeriodKey('2027-01')!, parsePeriodKey('2026-W53')!)).toBe(false);
		expect(contains(parsePeriodKey('2026')!, parsePeriodKey('2026-W53')!)).toBe(true);
		expect(contains(parsePeriodKey('2027')!, parsePeriodKey('2026-W53')!)).toBe(false);
	});
});

describe('dates', () => {
	test('addDays and weekday', () => {
		expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
		expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
		expect(weekday('2026-10-19')).toBe(1);
		expect(weekday('2026-10-25')).toBe(7);
	});
	test('todayIso uses local date', () => {
		expect(todayIso(new Date(2026, 9, 19, 23, 30))).toBe('2026-10-19');
	});
});

describe('enabled period kinds', () => {
	const noQuarter = { ...ALL_PERIODS, quarter: false };
	test('parentKind skips disabled kinds', () => {
		expect(parentKind('day', ALL_PERIODS)).toBe('week');
		expect(parentKind('month', ALL_PERIODS)).toBe('quarter');
		expect(parentKind('month', noQuarter)).toBe('year');
		expect(parentKind('day', { ...ALL_PERIODS, week: false })).toBe('month');
		expect(parentKind('year', ALL_PERIODS)).toBeNull();
		expect(parentKind('month', { ...noQuarter, year: false })).toBeNull();
	});
	test('childKindIn skips disabled kinds', () => {
		expect(childKindIn('year', ALL_PERIODS)).toBe('quarter');
		expect(childKindIn('year', noQuarter)).toBe('month');
		expect(childKindIn('month', { ...ALL_PERIODS, week: false })).toBe('day');
		expect(childKindIn('day', ALL_PERIODS)).toBeNull();
	});
});
