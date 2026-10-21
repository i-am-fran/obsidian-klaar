import { App, Modal, Setting } from 'obsidian';

class ConfirmCreateModal extends Modal {
	private answered = false;

	constructor(app: App, private readonly path: string, private readonly onAnswer: (create: boolean) => void) {
		super(app);
	}

	onOpen(): void {
		this.setTitle('Create period note?');
		this.contentEl.createEl('p', { text: `${this.path} doesn't exist yet.` });
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((b) =>
				b
					.setButtonText('Create')
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

	private answer(create: boolean): void {
		if (this.answered) return;
		this.answered = true;
		this.onAnswer(create);
	}
}

/** Asks whether to create the note at `path`; resolves true only if the user picks Create. */
export function confirmCreate(app: App, path: string): Promise<boolean> {
	return new Promise((resolve) => new ConfirmCreateModal(app, path, resolve).open());
}
