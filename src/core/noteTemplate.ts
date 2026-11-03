import type { IsoDate } from './dates';
import type { Period } from './periods';

/** Formats a date (an ISO day or a moment in time) with a moment-style format; injected so this file stays pure. */
export type DateFormatter = (date: IsoDate | Date, format: string) => string;

/** `{{name}}` or `{{name:FORMAT}}`; the name is a word, the format anything up to the closing braces. */
const PLACEHOLDER = /\{\{\s*(\w+)\s*(?::([^}]*))?\}\}/g;

/**
 * A new period note's text from a template, with core Templates' placeholders filled in: `{{title}}` is the period
 * key, `{{date}}` its first day (`YYYY-MM-DD` unless `{{date:FORMAT}}`), `{{time}}` now (`HH:mm` unless
 * `{{time:FORMAT}}`). Anything else, Templater code included, is left as written.
 */
export function fillTemplate(template: string, period: Period, now: Date, format: DateFormatter): string {
	return template.replace(PLACEHOLDER, (match: string, name: string, fmt: string | undefined) => {
		const custom = fmt?.trim();
		switch (name.toLowerCase()) {
			case 'title':
				return period.key;
			case 'date':
				return custom ? format(period.start, custom) : period.start;
			case 'time':
				return format(now, custom || 'HH:mm');
			default:
				return match;
		}
	});
}
