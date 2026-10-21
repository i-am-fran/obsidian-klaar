import { RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, type EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view';
import { type App, type MarkdownPostProcessor, editorLivePreviewField, setIcon } from 'obsidian';
import { doneLabel, scheduleLabel, scheduleTiming } from '../core/dateLabels';
import { todayIso } from '../core/dates';
import { parsePeriodKey } from '../core/periods';
import { lineSpans, markersOf, parseTaskLine } from '../core/taskLine';
import { openPeriodNote } from '../obsidian/periodNotes';
import type { KlaarSettings } from '../settings';

/** A schedule chip: calendar icon and label, coloured by timing; click opens the period note. */
export function renderScheduleChip(app: App, settings: KlaarSettings, key: string, open: boolean): HTMLElement {
	const today = todayIso();
	const chip = createSpan({ cls: 'klaar-chip', attr: { 'aria-label': key, 'data-tooltip-position': 'top' } });
	const timing = scheduleTiming(key, today, open);
	if (timing !== 'none') chip.addClass(`is-${timing}`);
	setIcon(chip.createSpan({ cls: 'klaar-chip-icon' }), 'calendar');
	chip.createSpan({ text: scheduleLabel(key, today, settings.dateLabels) });
	chip.addEventListener('mousedown', (evt) => evt.preventDefault());
	chip.addEventListener('click', (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		void openPeriodNote(app, settings, key, evt.metaKey || evt.ctrlKey);
	});
	return chip;
}

/** The done stamp as small muted text or a chip; null when it is hidden. */
export function renderDoneStamp(settings: KlaarSettings, date: string): HTMLElement | null {
	if (settings.doneStamp === 'hidden') return null;
	const el = createSpan({ cls: settings.doneStamp === 'chip' ? 'klaar-chip klaar-done-chip' : 'klaar-done-muted', attr: { 'aria-label': `Completed ${date}` } });
	setIcon(el.createSpan({ cls: 'klaar-chip-icon' }), 'check');
	el.createSpan({ text: doneLabel(date, todayIso()) });
	return el;
}

class ElementWidget extends WidgetType {
	constructor(
		private readonly id: string,
		private readonly build: () => HTMLElement,
	) {
		super();
	}
	eq(other: ElementWidget): boolean {
		return other.id === this.id;
	}
	toDOM(): HTMLElement {
		return this.build();
	}
	ignoreEvent(): boolean {
		// The chip handles its own clicks; the editor shouldn't move the cursor into it.
		return true;
	}
}

function buildDecorations(view: EditorView, app: App, settings: KlaarSettings): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	if (!view.state.field(editorLivePreviewField)) return builder.finish();
	const selection = view.state.selection.ranges;
	// Touching counts, so the raw text comes back as soon as the cursor reaches either end.
	const touched = (from: number, to: number) => selection.some((r) => r.from <= to && r.to >= from);
	const today = todayIso();
	for (const { from, to } of view.visibleRanges) {
		let pos = from;
		while (pos <= to) {
			const line = view.state.doc.lineAt(pos);
			pos = line.to + 1;
			if (!line.text.includes('[[')) continue;
			const parsed = parseTaskLine(line.text, markersOf(settings));
			if (!parsed) continue;
			const open = !parsed.checked && !parsed.cancelled && !parsed.someday;
			const spans = lineSpans(line.text);
			for (const s of spans.schedule) {
				const a = line.from + s.from;
				const b = line.from + s.to;
				if (touched(a, b)) continue;
				const id = `s|${s.key}|${scheduleLabel(s.key, today, settings.dateLabels)}|${scheduleTiming(s.key, today, open)}`;
				builder.add(a, b, Decoration.replace({ widget: new ElementWidget(id, () => renderScheduleChip(app, settings, s.key, open)) }));
			}
			const done = spans.done;
			if (done) {
				// The space before the stamp goes too: on a done line it would show struck through (the chip has its own margin).
				const a = line.from + done.from - 1;
				const b = line.from + done.to;
				if (touched(a, b)) continue;
				const el = () => renderDoneStamp(settings, done.date) ?? createSpan();
				builder.add(a, b, settings.doneStamp === 'hidden' ? Decoration.replace({}) : Decoration.replace({ widget: new ElementWidget(`d|${settings.doneStamp}|${done.date}`, el) }));
			}
		}
	}
	return builder.finish();
}

/** Live preview: schedule links and done stamps become chips, except where the cursor or selection is. */
export function dateChipsExtension(app: App, getSettings: () => KlaarSettings): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, app, getSettings());
			}
			update(update: ViewUpdate) {
				const modeChanged = update.startState.field(editorLivePreviewField) !== update.state.field(editorLivePreviewField);
				if (update.docChanged || update.viewportChanged || update.selectionSet || modeChanged) {
					this.decorations = buildDecorations(update.view, app, getSettings());
				}
			}
		},
		{ decorations: (v) => v.decorations },
	);
}

function isText(node: Node | null): node is Text {
	return node !== null && node.nodeType === Node.TEXT_NODE;
}

/** Reading mode: the same chips for `>[[KEY]]` and `(@done [[DATE]])` in rendered task items. */
export function dateChipsPostProcessor(app: App, getSettings: () => KlaarSettings): MarkdownPostProcessor {
	return (el) => {
		const settings = getSettings();
		for (const li of Array.from(el.querySelectorAll<HTMLElement>('li.task-list-item'))) {
			const state = li.dataset.task ?? ' ';
			const open = state !== 'x' && state !== 'X' && state !== '-' && !(state === '<' && settings.somedayMarker);
			for (const link of Array.from(li.querySelectorAll<HTMLElement>('a.internal-link'))) {
				if (link.closest('li') !== li) continue;
				const key = link.getAttr('data-href') ?? '';
				if (!parsePeriodKey(key)) continue;
				const before = link.previousSibling;
				const after = link.nextSibling;
				if (isText(before) && before.data.endsWith('>')) {
					before.data = before.data.slice(0, -1);
					link.replaceWith(renderScheduleChip(app, settings, key, open));
				} else if (isText(before) && before.data.endsWith('(@done ') && isText(after) && after.data.startsWith(')')) {
					// The space before goes too (it would show struck through on a done task); the stamp has its own margin.
					before.data = before.data.slice(0, -'(@done '.length).trimEnd();
					after.data = after.data.slice(1);
					const stamp = renderDoneStamp(settings, key);
					if (stamp) link.replaceWith(stamp);
					else link.remove();
				}
			}
		}
	};
}
