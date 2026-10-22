import { BasesView, Notice, type BasesQueryResult, type QueryController } from 'obsidian';
import { todayIso } from '../core/dates';
import type { TaskRef } from '../core/tasks';
import type { TaskIndex } from '../obsidian/taskIndex';
import { addTaskToPeriodNote, openPeriodNote } from '../obsidian/periodNotes';
import type { KlaarSettings } from '../settings';
import { askNewTask } from '../ui/newTaskModal';
import { TaskToolbar } from './toolbar';

export interface TasksViewDeps {
	index: TaskIndex;
	getSettings: () => KlaarSettings;
}

/**
 * What the Klaar Bases views share: re-render on index and query updates, a toolbar built once (so typing in
 * search keeps focus), and the tasks of the notes the base selects. Each view draws its body.
 */
export abstract class TaskBasesView extends BasesView {
	protected toolbar: TaskToolbar | null = null;
	private bodyEl: HTMLElement | null = null;

	constructor(controller: QueryController, protected containerEl: HTMLElement, protected deps: TasksViewDeps, private classes: { root: string; body: string }) {
		super(controller);
		// Registered on the Component, so the listener goes away when Bases unloads the view.
		this.registerEvent(this.deps.index.on('updated', () => this.render()));
	}

	onDataUpdated(): void {
		this.render();
	}

	protected noteName = (path: string): string => this.app.vault.getFileByPath(path)?.basename ?? path;

	protected get = (key: string): unknown => this.config.get(key);

	/** Draws the view into its (already emptied) body; returns how many tasks it shows. */
	protected abstract draw(body: HTMLElement, tasks: TaskRef[], query: string): number;

	/** Runs before the toolbar syncs; a view can move old saved keys here. */
	protected beforeSync(): void {}

	private buildToolbar(): void {
		const root = this.containerEl;
		root.empty();
		root.addClass(this.classes.root);
		const toolbar = new TaskToolbar(root, this.config, () => this.render());
		// A rebuilt toolbar keeps the search text the old one had.
		toolbar.query = this.toolbar?.query ?? '';
		this.toolbar = toolbar;
		this.bodyEl = root.createDiv({ cls: this.classes.body });
		toolbar.addSearch('Filter tasks, tags, notes');
		toolbar.addCount();
		toolbar.addButton('plus', 'New task', "New task in today's note", () => void this.addTask());
		toolbar.addButton('calendar', 'Today', "Open today's note", (e) => {
			void openPeriodNote(this.app, this.deps.getSettings(), todayIso(), e.metaKey || e.ctrlKey);
		}, true);
	}

	/** Asks for a task and adds it to today's note. The base may not include that note, so a notice says where it went. */
	private async addTask(): Promise<void> {
		const key = todayIso();
		const text = await askNewTask(this.app, key);
		if (text === null) return;
		try {
			const path = await addTaskToPeriodNote(this.app, this.deps.getSettings(), key, text);
			new Notice(`Added to ${path}`);
		} catch {
			new Notice("Couldn't add the task.");
		}
	}

	protected render(): void {
		// The index can fire before Bases has delivered the first result set.
		if (!(this.data as BasesQueryResult | undefined)?.data) return;
		if (!this.toolbar || !this.bodyEl || !this.containerEl.contains(this.toolbar.el)) this.buildToolbar();
		const body = this.bodyEl;
		const toolbar = this.toolbar;
		if (!body || !toolbar) return;

		this.beforeSync();
		toolbar.sync();
		const tasks: TaskRef[] = [];
		for (const entry of this.data.data) tasks.push(...this.deps.index.forPath(entry.file.path));
		body.empty();
		toolbar.setCount(this.draw(body, tasks, toolbar.activeQuery()), tasks.length);
	}
}
