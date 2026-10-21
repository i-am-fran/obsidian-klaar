import { addDays, makeIsoDate, weekday } from './dates';
import type { IsoDate } from './dates';
import { periodOf } from './periods';

export interface GridDay {
	date: IsoDate;
	inMonth: boolean;
}

export interface GridWeek {
	weekKey: string;
	weekNumber: number;
	days: GridDay[];
}

/** Monday-first rows covering the whole month; days from neighbouring months have inMonth: false. */
export function monthGrid(year: number, month: number): GridWeek[] {
	const first = makeIsoDate(year, month, 1) as IsoDate;
	const last = periodOf('month', first).end;
	let cursor = addDays(first, -(weekday(first) - 1));
	const rows: GridWeek[] = [];
	while (cursor <= last) {
		const days: GridDay[] = [];
		for (let i = 0; i < 7; i++) {
			const date = addDays(cursor, i);
			days.push({ date, inMonth: date >= first && date <= last });
		}
		const week = periodOf('week', cursor);
		rows.push({ weekKey: week.key, weekNumber: Number(week.key.slice(-2)), days });
		cursor = addDays(cursor, 7);
	}
	return rows;
}
