import { StateEffect, StateField, type Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';

const FLASH_MS = 2000;

/** The start of the line to flash, or null to clear it. */
const flashLineEffect = StateEffect.define<number | null>();

/** At most one flashed line, kept on its line while the note is edited. A decoration only: the text never changes. */
const flashField = StateField.define<DecorationSet>({
	create: () => Decoration.none,
	update(decos, tr) {
		decos = decos.map(tr.changes);
		for (const effect of tr.effects) {
			if (!effect.is(flashLineEffect)) continue;
			decos = effect.value === null ? Decoration.none : Decoration.set([Decoration.line({ class: 'klaar-flash-line' }).range(effect.value)]);
		}
		return decos;
	},
	provide: (field) => EditorView.decorations.from(field),
});

export const flashLineExtension: Extension = flashField;

/** Highlights `line` (0-based) for a moment. Does nothing if the editor lacks the extension or the line. */
export function flashLine(view: EditorView, line: number): void {
	if (view.state.field(flashField, false) === undefined || line + 1 > view.state.doc.lines) return;
	view.dispatch({ effects: flashLineEffect.of(view.state.doc.line(line + 1).from) });
	window.setTimeout(() => view.dispatch({ effects: flashLineEffect.of(null) }), FLASH_MS);
}
