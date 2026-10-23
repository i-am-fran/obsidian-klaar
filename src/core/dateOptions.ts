import { addDays, weekday } from './dates';
import type { IsoDate } from './dates';
import { ALL_PERIODS, PERIOD_ORDER, parsePeriodKey, periodOf } from './periods';
import type { EnabledPeriods, PeriodKind } from './periods';

export interface DateOption {
	label: string;
	key: string;
}

function enabledKey(key: string, enabled: EnabledPeriods): boolean {
	const kind: PeriodKind | undefined = parsePeriodKey(key)?.kind;
	return kind !== undefined && enabled[kind];
}

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Every option the date picker can offer for the enabled period kinds, in display order. */
export function buildDateOptions(today: IsoDate, enabled: EnabledPeriods = ALL_PERIODS): DateOption[] {
	const options: DateOption[] = [
		{ label: 'Today', key: today },
		{ label: 'Tomorrow', key: addDays(today, 1) },
	];
	// The next seven days, so today's own weekday name means a week from now.
	for (let i = 1; i <= 7; i++) {
		const date = addDays(today, i);
		options.push({ label: WEEKDAY_NAMES[weekday(date) - 1] ?? date, key: date });
	}
	const month = periodOf('month', today);
	options.push(
		{ label: 'This week', key: periodOf('week', today).key },
		{ label: 'Next week', key: periodOf('week', addDays(today, 7)).key },
		{ label: 'This month', key: month.key },
		{ label: 'Next month', key: periodOf('month', addDays(month.end, 1)).key },
		{ label: 'This quarter', key: periodOf('quarter', today).key },
		{ label: 'This year', key: periodOf('year', today).key },
	);
	return options.filter((o) => enabledKey(o.key, enabled));
}

/** How the current period of each kind is named: Today, This week... */
export const CURRENT_PERIOD_LABELS: Record<PeriodKind, string> = {
	day: 'Today',
	week: 'This week',
	month: 'This month',
	quarter: 'This quarter',
	year: 'This year',
};

/** The period of each enabled kind that holds `today`, smallest first; for jumping to their notes. */
export function currentPeriods(today: IsoDate, enabled: EnabledPeriods = ALL_PERIODS): (DateOption & { kind: PeriodKind })[] {
	return PERIOD_ORDER.filter((kind) => enabled[kind]).map((kind) => ({ kind, label: CURRENT_PERIOD_LABELS[kind], key: periodOf(kind, today).key }));
}

/**
 * Options matching a query, case-insensitively. An exact period key typed in
 * full comes first, then labels with a word starting with the query, then
 * labels merely containing it. An empty query returns everything.
 */
export function matchDateOptions(query: string, today: IsoDate, enabled: EnabledPeriods = ALL_PERIODS): DateOption[] {
	const all = buildDateOptions(today, enabled);
	const q = query.trim().toLowerCase();
	if (q === '') return all;

	const wordPrefix: DateOption[] = [];
	const substring: DateOption[] = [];
	for (const option of all) {
		const label = option.label.toLowerCase();
		if (label.startsWith(q) || label.includes(` ${q}`)) wordPrefix.push(option);
		else if (label.includes(q)) substring.push(option);
	}

	const exact = parsePeriodKey(query.trim().toUpperCase());
	const exactOptions = exact && enabled[exact.kind] ? [{ label: exact.key, key: exact.key }] : [];
	return [...exactOptions, ...wordPrefix, ...substring];
}
