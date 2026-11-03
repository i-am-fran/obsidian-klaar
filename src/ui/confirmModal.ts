import { App, Modal, Setting } from 'obsidian';

interface ConfirmOptions {
	title: string;
	message: string;
	/** The button that says yes. */
	action: string;
}

class ConfirmModal extends Modal {
	private answered = false;

	constructor(app: App, private readonly options: ConfirmOptions, private readonly onAnswer: (yes: boolean) => void) {
		super(app);
	}

	onOpen(): void {
		this.setTitle(this.options.title);
		this.contentEl.createEl('p', { text: this.options.message });
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((b) =>
				b
					.setButtonText(this.options.action)
					.setCta()
					.onClick(() => {
						this.answer(true);
						this.close();
					}),
			);
	}

	onClose(): void {
		this.answer(false);
		this.contentEl.empty();
	}

	private answer(yes: boolean): void {
		if (this.answered) return;
		this.answered = true;
		this.onAnswer(yes);
	}
}

/** Asks a yes/no question; resolves true only if the user picks the action button. */
export function confirm(app: App, options: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => new ConfirmModal(app, options, resolve).open());
}

/** Asks whether to create the note at `path`; resolves true only if the user picks Create. */
export function confirmCreate(app: App, path: string): Promise<boolean> {
	return confirm(app, { title: 'Create journal note?', message: `${path} doesn't exist yet.`, action: 'Create' });
}
