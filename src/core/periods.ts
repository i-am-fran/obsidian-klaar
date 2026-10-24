import { addDays, makeIsoDate, toUtcMs, weekday } from './dates';
import type { IsoDate } from './dates';

export type PeriodKind = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface Period {
	kind: PeriodKind;
	key: string;
	start: IsoDate; // inclusive
	end: IsoDate; // inclusive
}

/** Which period kinds are in use; disabled kinds are skipped by sections, the calendar and the date picker. */
export type EnabledPeriods = Record<PeriodKind, boolean>;

export const ALL_PERIODS: EnabledPeriods = { day: true, week: true, month: true, quarter: true, year: true };

/** Smallest to largest. */
export const PERIOD_ORDER: PeriodKind[] = ['day', 'week', 'month', 'quarter', 'year'];

/** The next enabled kind above `kind`, or null. */
export function parentKind(kind: PeriodKind, enabled: EnabledPeriods): PeriodKind | null {
	return PERIOD_ORDER.slice(PERIOD_ORDER.indexOf(kind) + 1).find((k) => enabled[k]) ?? null;
}

/** The next enabled kind below `kind`, or null. */
export function childKindIn(kind: PeriodKind, enabled: EnabledPeriods): PeriodKind | null {
	return PERIOD_ORDER.slice(0, PERIOD_ORDER.indexOf(kind)).reverse().find((k) => enabled[k]) ?? null;
}

function pad(n: number, width: number): string {
	return String(n).padStart(width, '0');
}

function yearOf(d: IsoDate): number {
	return Number(d.slice(0, 4));
}

function monthOf(d: IsoDate): number {
	return Number(d.slice(5, 7));
}

/** The ISO week a date belongs to (Monday start; week 1 holds the year's first Thursday). */
export function isoWeek(d: IsoDate): { year: number; week: number } {
	const thursday = addDays(d, 4 - weekday(d));
	const year = yearOf(thursday);
	const dayOfYear = (toUtcMs(thursday) - toUtcMs(`${pad(year, 4)}-01-01`)) / 86_400_000;
	return { year, week: Math.floor(dayOfYear / 7) + 1 };
}

/** Monday of ISO week 1 (the week containing 4 January). */
function isoWeekOneStart(year: number): IsoDate {
	const jan4 = `${pad(year, 4)}-01-04`;
	return addDays(jan4, 1 - weekday(jan4));
}

function lastDayOfMonth(year: number, month: number): IsoDate {
	const nextYear = month === 12 ? year + 1 : year;
	const nextMonth = month === 12 ? 1 : month + 1;
	return addDays(`${pad(nextYear, 4)}-${pad(nextMonth, 2)}-01`, -1);
}

function weekPeriod(year: number, week: number): Period {
	const start = addDays(isoWeekOneStart(year), (week - 1) * 7);
	return { kind: 'week', key: `${pad(year, 4)}-W${pad(week, 2)}`, start, end: addDays(start, 6) };
}

function monthPeriod(year: number, month: number): Period {
	return {
		kind: 'month',
		key: `${pad(year, 4)}-${pad(month, 2)}`,
		start: `${pad(year, 4)}-${pad(month, 2)}-01`,
		end: lastDayOfMonth(year, month),
	};
}

function quarterPeriod(year: number, quarter: number): Period {
	const firstMonth = (quarter - 1) * 3 + 1;
	return {
		kind: 'quarter',
		key: `${pad(year, 4)}-Q${quarter}`,
		start: `${pad(year, 4)}-${pad(firstMonth, 2)}-01`,
		end: lastDayOfMonth(year, firstMonth + 2),
	};
}

function yearPeriod(year: number): Period {
	return { kind: 'year', key: pad(year, 4), start: `${pad(year, 4)}-01-01`, end: `${pad(year, 4)}-12-31` };
}

export function periodOf(kind: PeriodKind, d: IsoDate): Period {
	switch (kind) {
		case 'day':
			return { kind, key: d, start: d, end: d };
		case 'week': {
			const { year, week } = isoWeek(d);
			return weekPeriod(year, week);
		}
		case 'month':
			return monthPeriod(yearOf(d), monthOf(d));
		case 'quarter':
			return quarterPeriod(yearOf(d), Math.floor((monthOf(d) - 1) / 3) + 1);
		case 'year':
			return yearPeriod(yearOf(d));
	}
}

/**
 * The period of `kind` holding `anchor`, moved `delta` periods back or forward. A week anchor counts by its Thursday,
 * so a week note's previous month is the one before the month that week belongs to.
 */
export function adjacentPeriod(kind: PeriodKind, anchor: Period, delta: number): Period {
	const d = anchor.kind === 'week' ? addDays(anchor.start, 3) : anchor.start;
	switch (kind) {
		case 'day':
			return periodOf('day', addDays(d, delta));
		case 'week':
			return periodOf('week', addDays(periodOf('week', d).start, delta * 7));
		case 'month':
		case 'quarter': {
			const months = kind === 'month' ? 1 : 3;
			const index = yearOf(d) * 12 + monthOf(d) - 1 + delta * months;
			const year = Math.floor(index / 12);
			return periodOf(kind, `${pad(year, 4)}-${pad(index - year * 12 + 1, 2)}-01`);
		}
		case 'year':
			return yearPeriod(yearOf(d) + delta);
	}
}

/** Parses a period key (day, week, month, quarter or year), or null if it isn't one. */
export function parsePeriodKey(key: string): Period | null {
	let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
	if (m) {
		const d = makeIsoDate(Number(m[1]), Number(m[2]), Number(m[3]));
		return d ? periodOf('day', d) : null;
	}
	m = /^(\d{4})-W(\d{2})$/.exec(key);
	if (m) {
		const year = Number(m[1]);
		const week = Number(m[2]);
		// 28 December always falls in the year's last ISO week.
		const lastWeek = isoWeek(`${pad(year, 4)}-12-28`).week;
		return week >= 1 && week <= lastWeek ? weekPeriod(year, week) : null;
	}
	m = /^(\d{4})-Q([1-4])$/.exec(key);
	if (m) return quarterPeriod(Number(m[1]), Number(m[2]));
	m = /^(\d{4})-(\d{2})$/.exec(key);
	if (m) {
		const month = Number(m[2]);
		return month >= 1 && month <= 12 ? monthPeriod(Number(m[1]), month) : null;
	}
	m = /^(\d{4})$/.exec(key);
	if (m) return yearPeriod(Number(m[1]));
	return null;
}

/**
 * True if `inner` sits inside `outer`. A week counts as inside a month, quarter
 * or year when its Thursday does (ISO convention: each week belongs to exactly
 * one month). Every other pair compares start and end ranges.
 */
export function contains(outer: Period, inner: Period): boolean {
	if (inner.kind === 'week' && (outer.kind === 'month' || outer.kind === 'quarter' || outer.kind === 'year')) {
		const thursday = addDays(inner.start, 3);
		return thursday >= outer.start && thursday <= outer.end;
	}
	return inner.start >= outer.start && inner.end <= outer.end;
}
