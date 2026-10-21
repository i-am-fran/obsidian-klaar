import { splitTags } from './taskFields';

/** A styled run's look: `*em*`, `**strong**`, `~~strike~~`, `==mark==`. */
export type InlineStyle = 'em' | 'strong' | 'strike' | 'mark';

/** One piece of a task's text, ready to render. `link` is a wikilink target as written, `url` a markdown link's (never a blocked scheme). */
export type InlineNode =
	| { text: string }
	| { tag: string }
	| { code: string }
	| { link: string; label: string }
	| { url: string; label: string }
	| { style: InlineStyle; children: InlineNode[] };

/** Delimiters, longest first, so `**` is tried before `*`. */
const DELIMITERS: [string, InlineStyle][] = [
	['**', 'strong'],
	['__', 'strong'],
	['~~', 'strike'],
	['==', 'mark'],
	['*', 'em'],
	['_', 'em'],
];

const WIKILINK = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/y;
const MD_LINK = /\[([^[\]]+)\]\(([^()\s]+)\)/y;
const ESCAPABLE = /[\\`*_~=[\]()#|!]/;
const WORD = /[\p{L}\p{N}]/u;

const URL_SCHEME = /^([a-z][a-z\d+.-]*):/i;
const EXTERNAL_SCHEMES = new Set(['http', 'https', 'mailto', 'obsidian']);

/**
 * What a markdown link's url is: `external` for web, mail and `obsidian://` links, `internal` for a vault path
 * (`Plan.md`), `blocked` for any other scheme (`javascript:`, `file:`...). `parseInline` turns a blocked link into
 * plain text, so it never reaches the DOM as a link.
 */
export function linkKind(url: string): 'external' | 'internal' | 'blocked' {
	const scheme = URL_SCHEME.exec(url)?.[1];
	if (scheme !== undefined) return EXTERNAL_SCHEMES.has(scheme.toLowerCase()) ? 'external' : 'blocked';
	// A path is decoded before it becomes a link (`My%20Note.md`), so `%6Aavascript:` must not pass as one.
	return URL_SCHEME.test(decodeOrKeep(url)) ? 'blocked' : 'internal';
}

function decodeOrKeep(url: string): string {
	try {
		return decodeURI(url);
	} catch {
		return url;
	}
}

/**
 * The inline markdown of one task line: code spans, wikilinks, markdown links, `*em*`, `**strong**`, `~~strike~~`,
 * `==mark==`, `#tags`, and `\` escapes. Anything that does not close stays as text, so nothing is ever lost.
 */
export function parseInline(text: string): InlineNode[] {
	const nodes: InlineNode[] = [];
	let buffer = '';
	const flush = () => {
		if (buffer === '') return;
		for (const part of splitTags(buffer)) nodes.push(part);
		buffer = '';
	};
	let i = 0;
	while (i < text.length) {
		const ch = text.charAt(i);
		if (ch === '\\' && ESCAPABLE.test(text.charAt(i + 1))) {
			buffer += text.charAt(i + 1);
			i += 2;
			continue;
		}
		if (ch === '`') {
			const end = text.indexOf('`', i + 1);
			if (end > i + 1) {
				flush();
				nodes.push({ code: text.slice(i + 1, end) });
				i = end + 1;
				continue;
			}
		}
		if (ch === '[') {
			WIKILINK.lastIndex = i;
			const wiki = WIKILINK.exec(text);
			const target = wiki?.[1]?.trim() ?? '';
			if (wiki && target !== '') {
				flush();
				nodes.push({ link: target, label: (wiki[2] ?? target).trim() });
				i = WIKILINK.lastIndex;
				continue;
			}
			MD_LINK.lastIndex = i;
			const md = MD_LINK.exec(text);
			if (md?.[1] !== undefined && md[2] !== undefined) {
				// A link with a scheme Klaar won't open (`javascript:`...) is just its label.
				if (linkKind(md[2]) === 'blocked') buffer += md[1];
				else {
					flush();
					nodes.push({ url: md[2], label: md[1] });
				}
				i = MD_LINK.lastIndex;
				continue;
			}
		}
		const styled = matchStyle(text, i);
		if (styled) {
			flush();
			nodes.push({ style: styled.style, children: parseInline(styled.inner) });
			i = styled.end;
			continue;
		}
		const delim = DELIMITERS.find(([d]) => text.startsWith(d, i));
		const literal = delim ? delim[0] : ch;
		buffer += literal;
		i += literal.length;
	}
	flush();
	return nodes;
}

/** A styled run opening at `start`: its style, inner text and the index after its closing delimiter. */
function matchStyle(text: string, start: number): { style: InlineStyle; inner: string; end: number } | null {
	for (const [delim, style] of DELIMITERS) {
		if (!text.startsWith(delim, start)) continue;
		const open = start + delim.length;
		// The opener needs text right after it, and `_` must not sit inside a word (snake_case).
		if (open >= text.length || /\s/.test(text.charAt(open))) return null;
		if (delim === '_' && WORD.test(text.charAt(start - 1))) return null;
		const close = findClose(text, open, delim);
		if (close === -1) return null;
		return { style, inner: text.slice(open, close), end: close + delim.length };
	}
	return null;
}

/** Index of the delimiter that closes a run whose text starts at `from`, or -1. Skips escapes, code and wikilinks. */
function findClose(text: string, from: number, delim: string): number {
	let j = from;
	while (j < text.length) {
		const ch = text.charAt(j);
		if (ch === '\\') {
			j += 2;
			continue;
		}
		if (ch === '`') {
			const end = text.indexOf('`', j + 1);
			if (end !== -1) {
				j = end + 1;
				continue;
			}
		}
		if (text.startsWith('[[', j)) {
			const end = text.indexOf(']]', j + 2);
			if (end !== -1) {
				j = end + 2;
				continue;
			}
		}
		if (text.startsWith(delim, j)) {
			// A single delimiter skips doubled ones, so `*a **b** c*` closes at the last `*`.
			if (delim.length === 1 && text.charAt(j + 1) === delim) {
				j += 2;
				continue;
			}
			const closes = j > from && !/\s/.test(text.charAt(j - 1)) && !(delim === '_' && WORD.test(text.charAt(j + 1)));
			if (closes) return j;
		}
		j += 1;
	}
	return -1;
}
