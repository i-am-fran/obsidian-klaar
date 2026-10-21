import { RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { type App, Keymap, type MarkdownPostProcessor } from 'obsidian';
import { ruleFor, type TagRule } from '../core/tagRules';
import { type InlineNode, linkKind, parseInline } from '../core/inlineMarkdown';
import { splitTags } from '../core/taskFields';

/** Class that turns a tag into a Klaar pill; `--klaar-tag-color` on the same element sets its colour. */
export const TAG_CLS = 'klaar-tag';

function buildDecorations(view: EditorView, rules: TagRule[]): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	if (rules.length === 0) return builder.finish();
	for (const { from, to } of view.visibleRanges) {
		let pos = from;
		while (pos <= to) {
			const line = view.state.doc.lineAt(pos);
			let offset = line.from;
			for (const part of splitTags(line.text)) {
				if ('text' in part) {
					offset += part.text.length;
					continue;
				}
				const rule = ruleFor(part.tag, rules);
				if (rule) {
					const deco = Decoration.mark({ class: TAG_CLS, attributes: { style: `--klaar-tag-color: ${rule.color}` } });
					builder.add(offset, offset + part.tag.length, deco);
				}
				offset += part.tag.length;
			}
			pos = line.to + 1;
		}
	}
	return builder.finish();
}

/**
 * Editor (source and live preview): colours the tags listed in settings. As an outer decoration the mark wraps
 * Obsidian's `.cm-hashtag-begin` (`#`) and `.cm-hashtag-end` (name) spans in one piece, so the tag variables it sets
 * reach them and the theme draws the pill. Code blocks have no `.cm-hashtag` spans, so tags there stay plain.
 */
export function tagHighlightExtension(getRules: () => TagRule[]): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, getRules());
			}
			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) this.decorations = buildDecorations(update.view, getRules());
			}
		},
		{
			provide: (p) =>
				EditorView.outerDecorations.of((view) => view.plugin(p)?.decorations ?? Decoration.none),
		},
	);
}

/** Reading mode: the same colours on rendered tag links. */
export function tagHighlightPostProcessor(getRules: () => TagRule[]): MarkdownPostProcessor {
	return (el) => {
		const rules = getRules();
		if (rules.length === 0) return;
		for (const a of Array.from(el.querySelectorAll<HTMLElement>('a.tag'))) {
			const rule = ruleFor(a.getAttr('href') ?? '', rules);
			if (!rule) continue;
			a.addClass(TAG_CLS);
			a.style.setProperty('--klaar-tag-color', rule.color);
		}
	};
}

/** Hover source id for page previews of links in Klaar's task text; registered in main.ts. */
export const HOVER_SOURCE = 'klaar';

/**
 * Task text with its inline markdown rendered: `*em*`, `**strong**`, `~~strike~~`, `==mark==`, `code`, wikilinks and
 * markdown links as clickable links, and each `#tag` as a tag span (tags listed in settings get their colour). Used by
 * Klaar's own task rows. Links resolve from the task's note, `sourcePath`.
 */
export function renderTaskText(el: HTMLElement, text: string, rules: TagRule[], app: App, sourcePath: string): void {
	el.addClass('klaar-inline-md');
	renderNodes(el, parseInline(text), rules, app, sourcePath);
}

const STYLE_TAGS = { em: 'em', strong: 'strong', strike: 'del', mark: 'mark' } as const;

function renderNodes(el: HTMLElement, nodes: InlineNode[], rules: TagRule[], app: App, sourcePath: string): void {
	for (const node of nodes) {
		if ('text' in node) el.appendText(node.text);
		else if ('tag' in node) renderTag(el, node.tag, rules);
		else if ('code' in node) el.createEl('code', { text: node.code });
		else if ('link' in node) renderLink(el, app, node.link, node.label, sourcePath);
		else if ('url' in node) renderUrl(el, app, node.url, node.label, sourcePath);
		else renderNodes(el.createEl(STYLE_TAGS[node.style]), node.children, rules, app, sourcePath);
	}
}

/**
 * A markdown link: a web, mail or `obsidian://` link opens outside, a path (`Plan.md`) is an internal link. Other
 * schemes never get here: `parseInline` already made them text.
 */
function renderUrl(el: HTMLElement, app: App, url: string, label: string, sourcePath: string): void {
	if (linkKind(url) !== 'external') {
		renderLink(el, app, decodeLinkPath(url), label, sourcePath);
		return;
	}
	const a = el.createEl('a', { text: label, cls: 'external-link', href: url, attr: { target: '_blank', rel: 'noopener nofollow' } });
	a.addEventListener('click', (evt) => evt.stopPropagation());
}

/** `My%20Note.md` as Obsidian's link text: `My Note.md`. A malformed escape is kept as written. */
function decodeLinkPath(url: string): string {
	try {
		return decodeURI(url);
	} catch {
		return url;
	}
}

/** An internal link like Obsidian's: opens the note (mod-click: new tab), page preview on hover, faded when unresolved. */
function renderLink(el: HTMLElement, app: App, linktext: string, label: string, sourcePath: string): HTMLElement {
	const a = el.createEl('a', { text: label, cls: 'internal-link', attr: { 'data-href': linktext, href: linktext } });
	const path = linktext.split(/[#^]/)[0] ?? '';
	if (path !== '' && !app.metadataCache.getFirstLinkpathDest(path, sourcePath)) a.addClass('is-unresolved');
	a.addEventListener('click', (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		void app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(evt));
	});
	a.addEventListener('mouseover', (event) => {
		app.workspace.trigger('hover-link', { event, source: HOVER_SOURCE, hoverParent: el, targetEl: a, linktext, sourcePath });
	});
	return a;
}

/** One tag pill, coloured when it has a rule. */
export function renderTag(el: HTMLElement, tag: string, rules: TagRule[]): HTMLElement {
	const span = el.createSpan({ text: tag, cls: 'tag klaar-tag-pill' });
	const rule = ruleFor(tag, rules);
	if (rule) {
		span.addClass(TAG_CLS);
		span.style.setProperty('--klaar-tag-color', rule.color);
	}
	return span;
}
