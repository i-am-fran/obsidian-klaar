import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from 'obsidian';
import { matchDateOptions, type DateOption } from '../core/dateOptions';
import { todayIso } from '../core/dates';
import { findDateTrigger } from '../core/dateTrigger';
import { markersOf, parseTaskLine } from '../core/taskLine';
import type { KlaarSettings } from '../settings';

/** Typing `>` on a task line offers dates; choosing one inserts `>[[KEY]]`. */
export class DateSuggest extends EditorSuggest<DateOption> {
	constructor(app: App, private readonly getSettings: () => KlaarSettings) {
		super(app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		if (!parseTaskLine(line, markersOf(this.getSettings()))) return null;
		const trigger = findDateTrigger(line.slice(0, cursor.ch), line.slice(cursor.ch));
		if (!trigger) return null;
		return {
			start: { line: cursor.line, ch: trigger.start },
			end: cursor,
			query: trigger.query,
		};
	}

	getSuggestions(context: EditorSuggestContext): DateOption[] {
		return matchDateOptions(context.query, todayIso(), this.getSettings().periods);
	}

	renderSuggestion(option: DateOption, el: HTMLElement): void {
		el.createSpan({ text: option.label });
		el.createSpan({ text: option.key, cls: 'klaar-suggest-key' });
	}

	selectSuggestion(option: DateOption): void {
		if (!this.context) return;
		this.context.editor.replaceRange(`>[[${option.key}]]`, this.context.start, this.context.end);
	}
}
