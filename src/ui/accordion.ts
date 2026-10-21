import { setIcon } from 'obsidian';

export interface AccordionOptions {
	title: string;
	/** Shown beside the title; omit for none. */
	count?: number;
	open: boolean;
	/** Extra classes on the root. */
	cls?: string[];
	onToggle: (open: boolean) => void;
	/** Icon button at the right of the header, beside it rather than inside it (a button can't nest in a button). */
	action?: { icon: string; label: string; onClick: (evt: MouseEvent) => void };
}

/**
 * Collapsible block: a header button and a body that animates open and closed.
 * Returns the body to fill. Closed bodies are `inert`, so they leave the tab order.
 */
export function renderAccordion(parent: HTMLElement, opts: AccordionOptions): { root: HTMLElement; body: HTMLElement } {
	const root = parent.createDiv({ cls: 'klaar-acc' });
	if (opts.cls) root.addClasses(opts.cls);

	const head = root.createEl('button', { cls: 'klaar-acc-head' });
	const chevron = head.createSpan({ cls: 'klaar-acc-chevron' });
	setIcon(chevron, 'chevron-right');
	head.createSpan({ text: opts.title, cls: 'klaar-acc-title' });
	if (opts.count !== undefined) head.createSpan({ text: String(opts.count), cls: 'klaar-acc-count' });

	if (opts.action) {
		const { icon, label, onClick } = opts.action;
		const btn = root.createEl('button', { cls: 'klaar-acc-action clickable-icon', attr: { 'aria-label': label } });
		setIcon(btn, icon);
		btn.addEventListener('click', onClick);
	}

	const collapse = root.createDiv({ cls: 'klaar-acc-collapse' });
	const inner = collapse.createDiv({ cls: 'klaar-acc-inner' });
	const body = inner.createDiv({ cls: 'klaar-acc-body' });

	const apply = (open: boolean) => {
		root.toggleClass('is-open', open);
		head.setAttr('aria-expanded', String(open));
		inner.toggleAttribute('inert', !open);
	};
	apply(opts.open);

	head.addEventListener('click', () => {
		const open = !root.hasClass('is-open');
		apply(open);
		opts.onToggle(open);
	});
	return { root, body };
}
