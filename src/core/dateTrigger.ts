export interface DateTrigger {
	/** Index of the `>` in the line. */
	start: number;
	/** Text typed after the `>`. */
	query: string;
}

const MAX_QUERY = 20;
const TRIGGER = new RegExp(`(?:^|\\s)>([\\w\\- ]{0,${MAX_QUERY}})$`);

/**
 * Whether the text before the cursor ends in a `>` date trigger. The `>` must
 * start the line or follow whitespace (so `->` and `=>` don't fire), and the
 * text after the cursor must not already be a `[[` link. A space right after
 * the `>` is prose (`a > b`), not a trigger.
 */
export function findDateTrigger(lineBeforeCursor: string, textAfterCursor = ''): DateTrigger | null {
	if (textAfterCursor.startsWith('[[')) return null;
	const match = TRIGGER.exec(lineBeforeCursor);
	if (!match) return null;
	const query = match[1] ?? '';
	if (query.startsWith(' ')) return null;
	return { start: lineBeforeCursor.length - query.length - 1, query };
}
