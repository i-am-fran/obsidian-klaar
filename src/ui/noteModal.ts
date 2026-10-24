import { App, FuzzySuggestModal, TFile } from 'obsidian';

class NoteModal extends FuzzySuggestModal<TFile> {
	constructor(app: App, private readonly exclude: string, private readonly onPick: (file: TFile) => void) {
		super(app);
		this.setPlaceholder('Move task to note…');
	}

	/** Recently opened notes first, then the rest of the vault. */
	getItems(): TFile[] {
		const files = this.app.vault.getMarkdownFiles().filter((f) => f.path !== this.exclude);
		const recent = this.app.workspace.getLastOpenFiles();
		const rank = (f: TFile) => {
			const i = recent.indexOf(f.path);
			return i === -1 ? recent.length : i;
		};
		return files.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));
	}

	getItemText(file: TFile): string {
		return file.path.slice(0, -'.md'.length);
	}

	onChooseItem(file: TFile): void {
		this.onPick(file);
	}
}

/** Asks for a note other than `exclude` and calls `onPick` with it. */
export function openNoteModal(app: App, exclude: string, onPick: (file: TFile) => void): void {
	new NoteModal(app, exclude, onPick).open();
}
