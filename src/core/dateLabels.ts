import { addDays, type IsoDate } from './dates';
import { isoWeek, parsePeriodKey } from './periods';

export type DateLabelStyle = 'friendly' | 'key';
export type Timing = 'overdue' | 'current' | 'none';

function format(d: IsoDate, opts: Intl.DateTimeFormatOptions, locale?: string): string {
	return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
}

/**
 * Display text for a schedule key. Friendly: Today, Tomorrow, Yesterday, `Fri 23 Oct`, `Week 43`,
 * `Oct 2026`, `Q4 2026`, `2026`, with the year added to days and weeks outside the current one.
 * `locale` defaults to the user's.
 */
export function scheduleLabel(key: string, today: IsoDate, style: DateLabelStyle, locale?: string): string {
	const period = style === 'friendly' ? parsePeriodKey(key) : null;
	if (!period) return key;
	const thisYear = today.slice(0, 4);
	switch (period.kind) {
		case 'day': {
			if (key === today) return 'Today';
			if (key === addDays(today, 1)) return 'Tomorrow';
			if (key === addDays(today, -1)) return 'Yesterday';
			const year = key.slice(0, 4) === thisYear ? {} : { year: 'numeric' as const };
			return format(key, { weekday: 'short', day: 'numeric', month: 'short', ...year }, locale);
		}
		case 'week': {
			const { year, week } = isoWeek(period.start);
			return year === isoWeek(today).year ? `Week ${week}` : `Week ${week}, ${year}`;
		}
		case 'month':
			return format(period.start, { month: 'short', year: 'numeric' }, locale);
		case 'quarter':
			return `${key.slice(5)} ${key.slice(0, 4)}`;
		case 'year':
			return key;
	}
}

/** Overdue: an open task whose period ended before today. Current: an open task whose period holds today. */
export function scheduleTiming(key: string, today: IsoDate, open: boolean): Timing {
	const period = parsePeriodKey(key);
	if (!open || !period) return 'none';
	if (period.end < today) return 'overdue';
	return period.start <= today ? 'current' : 'none';
}

/** `20 Oct` for a done date, with the year when it isn't this year. */
export function doneLabel(date: IsoDate, today: IsoDate, locale?: string): string {
	const year = date.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' as const };
	return format(date, { day: 'numeric', month: 'short', ...year }, locale);
}
