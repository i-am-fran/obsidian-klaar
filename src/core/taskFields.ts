/** A heading and the line it sits on. */
export interface HeadingPos {
	line: number;
	heading: string;
}

/** `#` at the start or after whitespace, then tag characters. */
const TAG = /(?:^|\s)(#[\p{L}\p{N}_\-/]+)/gu;

/** Text split into plain runs and `#tag` runs (with `#`), in order, for rendering. Numeric `#123` stays text. */
export function splitTags(text: string): ({ text: string } | { tag: string })[] {
	const parts: ({ text: string } | { tag: string })[] = [];
	let pos = 0;
	for (const m of text.matchAll(TAG)) {
		const tag = m[1];
		if (tag === undefined || /^#\d+$/.test(tag)) continue;
		const start = m.index + m[0].length - tag.length;
		if (start > pos) parts.push({ text: text.slice(pos, start) });
		parts.push({ tag });
		pos = start + tag.length;
	}
	if (pos < text.length) parts.push({ text: text.slice(pos) });
	return parts;
}

/** The text without the tags `drop` picks, for places that show those tags in their own column. */
export function withoutTags(text: string, drop: (tag: string) => boolean): string {
	return splitTags(text)
		.map((p) => ('text' in p ? p.text : drop(p.tag) ? '' : p.tag))
		.join('')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Inline tags in the order they appear, with `#`, without duplicates. Purely numeric ones (`#123`) are not tags. */
export function tagsOf(text: string): string[] {
	const tags: string[] = [];
	for (const m of text.matchAll(TAG)) {
		const tag = m[1];
		if (tag === undefined || /^#\d+$/.test(tag) || tags.includes(tag)) continue;
		tags.push(tag);
	}
	return tags;
}

/** The last heading above `line`; `headings` is in document order. */
export function headingAt(headings: HeadingPos[], line: number): string | null {
	let found: string | null = null;
	for (const h of headings) {
		if (h.line >= line) break;
		found = h.heading;
	}
	return found;
}
