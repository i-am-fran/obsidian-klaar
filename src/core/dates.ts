// ISO date-string helpers. All maths runs on UTC midnight so DST can't shift dates.

export type IsoDate = string; // YYYY-MM-DD

const DAY_MS = 86_400_000;

function pad(n: number, width: number): string {
	return String(n).padStart(width, '0');
}

export function toUtcMs(d: IsoDate): number {
	return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
}

export function fromUtcMs(ms: number): IsoDate {
	const dt = new Date(ms);
	return `${pad(dt.getUTCFullYear(), 4)}-${pad(dt.getUTCMonth() + 1, 2)}-${pad(dt.getUTCDate(), 2)}`;
}

/** Builds a date from parts, or null if it isn't a real calendar date (e.g. 2026-02-30). */
export function makeIsoDate(year: number, month: number, day: number): IsoDate | null {
	const iso = fromUtcMs(Date.UTC(year, month - 1, day));
	return iso === `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` ? iso : null;
}

export function addDays(d: IsoDate, n: number): IsoDate {
	return fromUtcMs(toUtcMs(d) + n * DAY_MS);
}

/** 1 = Monday ... 7 = Sunday. */
export function weekday(d: IsoDate): number {
	const js = new Date(toUtcMs(d)).getUTCDay(); // 0 = Sunday
	return js === 0 ? 7 : js;
}

/** Today's date in the local timezone. */
export function todayIso(now: Date = new Date()): IsoDate {
	return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`;
}
