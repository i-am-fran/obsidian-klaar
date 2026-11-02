import { App, Modal, Notice } from 'obsidian';
import { scheduleLabel } from '../core/dateLabels';
import { todayIso } from '../core/dates';
import { isOverdue, taskPeriod } from '../core/query';
import { toggleCancelled, toggleSomeday } from '../core/taskLine';
import type { TaskRef } from '../core/tasks';
import { rewriteTask, sendTask, undoSend, type SendRecord } from '../obsidian/moveTask';
import type { KlaarSettings } from '../settings';
import { openScheduleModal } from './scheduleModal';
import { renderTaskText } from './tagHighlight';
import { quickTargets } from './taskMenu';

interface Action {
	key: string;
	label: string;
	run: (task: TaskRef) => Promise<SendRecord | null> | 'skip' | 'pick';
}

/** Keys for the quick targets, by label. */
const TARGET_KEYS: Record<string, string> = { Today: 't', Tomorrow: 'm', 'This week': 'w', 'Next week': 'n', 'This month': 'o', 'Next month': 'x' };

/**
 * Goes through the overdue tasks one at a time, oldest first; one key (or button) sends each to a period, parks or
 * cancels it, or skips it. Backspace undoes the last one. Closing keeps what was done.
 */
class ReviewModal extends Modal {
	private readonly tasks: TaskRef[];
	private index = 0;
	private busy = false;
	private readonly history: { index: number; record: SendRecord | null }[] = [];
	private readonly actions: Action[];

	constructor(app: App, private readonly settings: KlaarSettings, all: TaskRef[]) {
		super(app);
		const today = todayIso();
		const start = (t: TaskRef) => taskPeriod(t)?.start ?? '';
		this.tasks = all.filter((t) => !t.subtask && isOverdue(t, today)).sort((a, b) => start(a).localeCompare(start(b)));
		this.actions = [
			...quickTargets(settings).map(({ label, key }) => ({
				key: TARGET_KEYS[label] ?? '',
				label,
				run: (task: TaskRef) => sendTask(this.app, this.settings, task, key),
			})),
			{ key: 'd', label: 'Pick a date…', run: () => 'pick' as const },
			...(settings.somedayMarker ? [{ key: 's', label: 'Someday', run: (task: TaskRef) => rewriteTask(this.app, task, toggleSomeday) }] : []),
			{ key: 'c', label: 'Cancel task', run: (task: TaskRef) => rewriteTask(this.app, task, toggleCancelled) },
			{ key: 'Enter', label: 'Skip', run: () => 'skip' as const },
		];
	}

	onOpen(): void {
		this.modalEl.addClass('klaar-review');
		this.setTitle('Review overdue');
		for (const action of this.actions) {
			this.scope.register([], action.key, (e) => {
				e.preventDefault();
				void this.apply(action);
				return false;
			});
		}
		this.scope.register([], 'Backspace', (e) => {
			e.preventDefault();
			void this.undo();
			return false;
		});
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const el = this.contentEl;
		el.empty();
		const total = this.tasks.length;
		const task = this.tasks[this.index];
		const head = el.createDiv({ cls: 'klaar-review-head' });
		head.createSpan({ text: task ? `${this.index + 1} of ${total}` : `${total} of ${total}`, cls: 'klaar-review-count' });
		const bar = el.createDiv({ cls: 'klaar-review-bar' }).createDiv();
		bar.style.setProperty('width', total === 0 ? '100%' : `${(this.index / total) * 100}%`);

		if (!task) {
			el.createDiv({ cls: 'klaar-review-done', text: total === 0 ? 'Nothing is overdue.' : 'All caught up.' });
			if (this.history.length > 0) this.renderUndo(el);
			return;
		}
		const card = el.createDiv({ cls: 'klaar-review-task' });
		renderTaskText(card.createDiv({ cls: 'klaar-review-text' }), task.text, this.settings.tags, this.app, task.path);
		const meta = card.createDiv({ cls: 'klaar-review-meta' });
		meta.appendText(this.app.vault.getFileByPath(task.path)?.basename ?? task.path);
		if (task.scheduleKey) meta.createSpan({ cls: 'klaar-review-overdue', text: ` · overdue since ${scheduleLabel(task.scheduleKey, todayIso(), this.settings.dateLabels)}` });

		const buttons = el.createDiv({ cls: 'klaar-review-actions' });
		for (const action of this.actions) {
			const button = buttons.createEl('button', { text: action.label });
			button.createEl('kbd', { text: action.key === 'Enter' ? '↵' : action.key.toUpperCase() });
			button.addEventListener('click', () => void this.apply(action));
		}
		if (this.history.length > 0) this.renderUndo(el);
	}

	private renderUndo(el: HTMLElement): void {
		const undo = el.createEl('button', { text: 'Undo last', cls: 'klaar-review-undo mod-muted' });
		undo.createEl('kbd', { text: '⌫' });
		undo.addEventListener('click', () => void this.undo());
	}

	private async apply(action: Action): Promise<void> {
		const task = this.tasks[this.index];
		if (!task || this.busy) return;
		const result = action.run(task);
		if (result === 'pick') {
			openScheduleModal(this.app, this.settings.periods, (key) => {
				void this.record(sendTask(this.app, this.settings, task, key));
			});
			return;
		}
		await this.record(result === 'skip' ? null : result);
	}

	/** Waits for the change (none for a skip), then moves on; a task that couldn't be changed stays up. */
	private async record(change: Promise<SendRecord | null> | null): Promise<void> {
		this.busy = true;
		try {
			const record = change ? await change : null;
			if (change && !record) return;
			this.history.push({ index: this.index, record });
			this.index++;
		} catch {
			new Notice("Couldn't update the task.");
		} finally {
			this.busy = false;
			this.render();
		}
	}

	private async undo(): Promise<void> {
		const last = this.history[this.history.length - 1];
		if (!last || this.busy) return;
		this.busy = true;
		try {
			if (last.record && !(await undoSend(this.app, last.record))) return;
			this.history.pop();
			this.index = last.index;
		} finally {
			this.busy = false;
			this.render();
		}
	}
}

/** Opens the overdue review over `all` tasks (a snapshot: tasks that become overdue meanwhile wait for the next run). */
export function openReviewModal(app: App, settings: KlaarSettings, all: TaskRef[]): void {
	new ReviewModal(app, settings, all).open();
}
