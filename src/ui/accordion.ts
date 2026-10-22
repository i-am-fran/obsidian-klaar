import { setIcon } from 'obsidian';

export interface AccordionOptions {
	title: string;
	/** Shown beside the title; omit for none. */
	count?: number;
	open: boolean;
	/** Extra classes on the root. */
	cls?: string[];
	onToggle: (open: boolean) => void;
	/**
	 * Makes the title a link of its own, e.g. to open a note. Only the chevron then opens and closes the block, so the
	 * two clicks never compete.
	 */
	onTitleClick?: (evt: MouseEvent) => void;
}

/**
 * Collapsible block: a header and a body that animates open and closed. The whole header is the toggle button, or
 * with `onTitleClick` only its chevron is. Returns the body to fill. Closed bodies are `inert`, so they leave the tab
 * order.
 */
export function renderAccordion(parent: HTMLElement, opts: AccordionOptions): { root: HTMLElement; body: HTMLElement } {
	const root = parent.createDiv({ cls: 'klaar-acc' });
	if (opts.cls) root.addClasses(opts.cls);

	const { onTitleClick } = opts;
	const split = onTitleClick !== undefined;
	const head = split ? root.createDiv({ cls: 'klaar-acc-head is-split' }) : root.createEl('button', { cls: 'klaar-acc-head' });
	const toggle = split ? head.createEl('button', { cls: 'klaar-acc-chevron clickable-icon' }) : head.createSpan({ cls: 'klaar-acc-chevron' });
	setIcon(toggle, 'chevron-right');
	if (onTitleClick) {
		const title = head.createEl('a', { text: opts.title, cls: 'klaar-acc-title', attr: { href: '#' } });
		title.addEventListener('click', (evt) => {
			evt.preventDefault();
			onTitleClick(evt);
		});
	} else {
		head.createSpan({ text: opts.title, cls: 'klaar-acc-title' });
	}
	if (opts.count !== undefined) head.createSpan({ text: String(opts.count), cls: 'klaar-acc-count' });
	const button = split ? toggle : head;

	const collapse = root.createDiv({ cls: 'klaar-acc-collapse' });
	const inner = collapse.createDiv({ cls: 'klaar-acc-inner' });
	const body = inner.createDiv({ cls: 'klaar-acc-body' });

	const apply = (open: boolean) => {
		root.toggleClass('is-open', open);
		button.setAttr('aria-expanded', String(open));
		if (split) button.setAttr('aria-label', open ? `Collapse ${opts.title}` : `Expand ${opts.title}`);
		inner.toggleAttribute('inert', !open);
	};
	apply(opts.open);

	button.addEventListener('click', () => {
		const open = !root.hasClass('is-open');
		apply(open);
		opts.onToggle(open);
	});
	return { root, body };
}
