import { App, Modal, Setting } from 'obsidian';

class NewTaskModal extends Modal {
	private text = '';
	private answered = false;

	constructor(app: App, private readonly where: string, private readonly onAnswer: (text: string | null) => void) {
		super(app);
	}

	onOpen(): void {
		this.setTitle('New task');
		const input = this.contentEl.createEl('input', { type: 'text', cls: 'klaar-new-task-input', attr: { placeholder: `Add to ${this.where}` } });
		input.addEventListener('input', () => (this.text = input.value));
		input.addEventListener('keydown', (e) => {
			if (e.key !== 'Enter' || e.isComposing) return;
			e.preventDefault();
			this.submit();
		});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((b) => b.setButtonText('Add').setCta().onClick(() => this.submit()));
		input.focus();
	}

	onClose(): void {
		this.answer(null);
		this.contentEl.empty();
	}

	/** An empty task is not added; the modal stays open. */
	private submit(): void {
		if (this.text.trim() === '') return;
		this.answer(this.text);
		this.close();
	}

	private answer(text: string | null): void {
		if (this.answered) return;
		this.answered = true;
		this.onAnswer(text);
	}
}

/** Asks for a task's text; resolves null if the user cancels. `where` names the note it will go to. */
export function askNewTask(app: App, where: string): Promise<string | null> {
	return new Promise((resolve) => new NewTaskModal(app, where, resolve).open());
}
