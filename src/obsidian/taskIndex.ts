import { App, Events, MarkdownView, TFile, debounce, type CachedMetadata } from 'obsidian';
import { todayIso } from '../core/dates';
import { newlyChecked, newlyUnchecked } from '../core/newlyChecked';
import { markersOf, removeDoneStamp, setChecked } from '../core/taskLine';
import { extractTasks, locateTaskLine, type TaskRef } from '../core/tasks';
import type { KlaarSettings } from '../settings';
import { editTask } from './editTask';
import { periodOfFile } from './periodNotes';

/** Every task in the vault, kept in memory. Fires 'updated' (debounced) when it changes. */
export class TaskIndex extends Events {
	private byPath = new Map<string, TaskRef[]>();
	private readonly notify = debounce(() => this.trigger('updated'), 300, true);

	constructor(private app: App, private getSettings: () => KlaarSettings) {
		super();
	}

	all(): TaskRef[] {
		return [...this.byPath.values()].flat();
	}

	forPath(path: string): TaskRef[] {
		return this.byPath.get(path) ?? [];
	}

	/** Reads every markdown file. Never stamps: there is no previous snapshot yet. */
	async build(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		await Promise.all(files.map(async (file) => this.store(file, await this.app.vault.cachedRead(file))));
		this.notify();
	}

	/** Wire up the vault and metadata listeners; call once the layout is ready. */
	register(register: (ref: ReturnType<Events['on']>) => void): void {
		const { vault, metadataCache } = this.app;
		register(metadataCache.on('changed', (file, data, cache) => this.onChanged(file, data, cache)));
		register(vault.on('delete', (file) => {
			if (this.byPath.delete(file.path)) this.notify();
		}));
		register(vault.on('rename', (file, oldPath) => {
			this.byPath.delete(oldPath);
			if (file instanceof TFile && file.extension === 'md') {
				void this.app.vault.cachedRead(file).then((data) => {
					this.store(file, data);
					this.notify();
				});
			} else this.notify();
		}));
	}

	private extract(file: TFile, data: string, cache: CachedMetadata | null): TaskRef[] {
		const items = cache?.listItems ?? [];
		const taskLines = items.filter((item) => item.task !== undefined).map((item) => item.position.start.line);
		const parents = new Map(items.map((item) => [item.position.start.line, item.parent]));
		// Same split as editTask, so `raw` matches byte-for-byte.
		const settings = this.getSettings();
		const period = periodOfFile(file, settings.periodFolder);
		const headings = (cache?.headings ?? []).map((h) => ({ line: h.position.start.line, heading: h.heading }));
		return extractTasks(file.path, data.split('\n'), taskLines, period, headings, settings.tags, settings.slashInProgress, markersOf(settings), parents);
	}

	private store(file: TFile, data: string): TaskRef[] {
		const tasks = this.extract(file, data, this.app.metadataCache.getFileCache(file));
		this.byPath.set(file.path, tasks);
		return tasks;
	}

	private onChanged(file: TFile, data: string, cache: CachedMetadata): void {
		if (file.extension !== 'md') return;
		const prev = this.byPath.get(file.path);
		const next = this.extract(file, data, cache);
		this.byPath.set(file.path, next);
		this.notify();

		if (!prev || !this.getSettings().stampDone) return;
		const stamp = (line: string) => setChecked(line, true, todayIso(), true);
		const ticked = newlyChecked(prev, next);
		if (ticked.length > 0) this.rewriteInActiveView(file.path, ticked, stamp);
		const unticked = newlyUnchecked(prev, next);
		if (unticked.length > 0) this.rewriteInActiveView(file.path, unticked, removeDoneStamp);
	}

	/**
	 * Adds or removes the done stamp through the view the user (un)ticked in.
	 * Changes with no active view on that file (sync, other plugins, background
	 * edits) are never touched. Our own rewrite re-fires 'changed' with the stamp
	 * already right, which newlyChecked and newlyUnchecked ignore.
	 */
	private rewriteInActiveView(path: string, refs: TaskRef[], change: (line: string) => string): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view?.file?.path !== path) return;
		// Reading mode keeps a stale editor buffer and nobody is typing, so write the file.
		if (view.getMode() === 'preview') {
			for (const ref of refs) void editTask(this.app, ref, change, { silent: true });
			return;
		}
		const editor = view.editor;
		for (const ref of refs) {
			const n = locateTaskLine(editor.getValue().split('\n'), ref);
			if (n === null) continue;
			editor.setLine(n, change(editor.getLine(n)));
		}
	}
}
