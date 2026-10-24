import { setIcon } from 'obsidian';
import { TOOLBAR_KEY } from '../core/taskTable';

/** The slice of a Bases view config the toolbar needs. */
interface ToolbarConfig {
	get(key: string): unknown;
}

/**
 * Search box, task count and buttons shared by the Bases views. Filters, sort and grouping live in the view's
 * menu only. Built once, so re-renders never steal focus from the search box.
 */
export class TaskToolbar {
	/** Search text; kept in the view only, never saved. */
	query = '';
	readonly el: HTMLElement;
	private countEl: HTMLElement | null = null;

	constructor(parent: HTMLElement, private config: ToolbarConfig, private onChange: () => void) {
		this.el = parent.createDiv({ cls: 'klaar-toolbar' });
	}

	addSearch(placeholder: string): void {
		const search = this.el.createEl('input', { type: 'search', cls: 'klaar-search', attr: { placeholder } });
		search.value = this.query;
		search.addEventListener('input', () => {
			this.query = search.value;
			this.onChange();
		});
	}

	addCount(): void {
		this.countEl = this.el.createSpan({ cls: 'klaar-toolbar-count' });
	}

	/** "12 of 40" while search or filters hide some tasks, else "40 tasks". */
	setCount(shown: number, total: number): void {
		if (!this.countEl) return;
		this.countEl.setText(shown < total ? `${shown} of ${total}` : total === 1 ? '1 task' : `${total} tasks`);
	}

	/**
	 * A theme-styled button with an icon and short text; `tooltip` says more and must contain `text`. On mobile the
	 * text is hidden and the icon stands alone (the tooltip still names the button). Pass `parent` to place it in a group.
	 */
	addButton(icon: string, text: string, tooltip: string, onClick: (evt: MouseEvent) => void, parent: HTMLElement = this.el): HTMLButtonElement {
		const button = parent.createEl('button', { cls: 'klaar-toolbar-button', attr: { 'aria-label': tooltip } });
		setIcon(button.createSpan({ cls: 'klaar-toolbar-button-icon' }), icon);
		if (text !== '') button.createSpan({ cls: 'klaar-toolbar-button-text', text });
		button.addEventListener('click', onClick);
		return button;
	}

	/** A box that joins the buttons added to it into one split button. */
	addGroup(): HTMLElement {
		return this.el.createDiv({ cls: 'klaar-toolbar-split' });
	}

	/** Shows or hides the bar (TOOLBAR_KEY). */
	sync(): void {
		this.el.toggle(this.shown());
	}

	/** The search text, or '' while the toolbar is hidden: a hidden search box must not keep filtering rows out of sight. */
	activeQuery(): string {
		return this.shown() ? this.query : '';
	}

	private shown(): boolean {
		return this.config.get(TOOLBAR_KEY) !== false;
	}
}
