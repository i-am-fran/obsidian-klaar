import { App, SuggestModal } from 'obsidian';
import { matchDateOptions, type DateOption } from '../core/dateOptions';
import { todayIso } from '../core/dates';
import type { EnabledPeriods } from '../core/periods';

class MoveModal extends SuggestModal<DateOption> {
	constructor(app: App, private readonly enabled: EnabledPeriods, private readonly onPick: (key: string) => void) {
		super(app);
		this.setPlaceholder('Move task to…');
	}

	getSuggestions(query: string): DateOption[] {
		return matchDateOptions(query, todayIso(), this.enabled);
	}

	renderSuggestion(option: DateOption, el: HTMLElement): void {
		el.createSpan({ text: option.label });
		el.createSpan({ text: option.key, cls: 'klaar-suggest-key' });
	}

	onChooseSuggestion(option: DateOption): void {
		this.onPick(option.key);
	}
}

/** Asks for a date or period of an enabled kind and calls `onPick` with its key. */
export function openMoveModal(app: App, enabled: EnabledPeriods, onPick: (key: string) => void): void {
	new MoveModal(app, enabled, onPick).open();
}
