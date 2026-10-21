import { ItemView, Notice, WorkspaceLeaf, setIcon } from 'obsidian';
import { todayIso } from '../core/dates';
import type { IsoDate } from '../core/dates';
import { TASK_DRAG_MIME, parseDragPayload } from '../core/dragPayload';
import { monthGrid } from '../core/monthGrid';
import { periodOf } from '../core/periods';
import { scheduleStatus } from '../core/query';
import { setSchedule } from '../core/taskLine';
import { editTask } from '../obsidian/editTask';
import { openPeriodNote, periodNotePath, periodOfFile } from '../obsidian/periodNotes';
import type { TaskIndex } from '../obsidian/taskIndex';
import type { KlaarSettings } from '../settings';

export const VIEW_TYPE_CALENDAR = 'klaar-calendar';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Makes a non-button element clickable from the keyboard (Enter or Space) as well as the mouse. */
function onActivate(el: HTMLElement, handler: (evt: MouseEvent | KeyboardEvent) => void): void {
	el.setAttr('role', 'button');
	el.setAttr('tabindex', '0');
	el.addEventListener('click', handler);
	el.addEventListener('keydown', (e) => {
		if (e.key !== 'Enter' && e.key !== ' ') return;
		e.preventDefault();
		handler(e);
	});
}

export interface CalendarDeps {
	index: TaskIndex;
	getSettings: () => KlaarSettings;
}

/** Right-sidebar month grid with ISO week numbers; days and weeks show note and task markers; days accept dropped tasks. */
export class CalendarView extends ItemView {
	private year: number;
	private month: number;
	private today: IsoDate = todayIso();
	/** Key of the period note open in the editor, or null. */
	private openKey: string | null = null;

	constructor(leaf: WorkspaceLeaf, private deps: CalendarDeps) {
		super(leaf);
		this.year = Number(this.today.slice(0, 4));
		this.month = Number(this.today.slice(5, 7));
	}

	getViewType(): string {
		return VIEW_TYPE_CALENDAR;
	}

	getDisplayText(): string {
		return 'Calendar';
	}

	getIcon(): string {
		return 'calendar';
	}

	onOpen(): Promise<void> {
		this.registerEvent(this.deps.index.on('updated', () => this.render()));
		this.registerEvent(this.app.workspace.on('file-open', () => this.syncOpenKey()));
		// The note dots follow period notes being created, deleted or renamed.
		this.registerEvent(this.app.vault.on('create', () => this.render()));
		this.registerEvent(this.app.vault.on('delete', () => this.render()));
		this.registerEvent(this.app.vault.on('rename', () => this.render()));
		this.registerInterval(
			window.setInterval(() => {
				const now = todayIso();
				if (now !== this.today) {
					this.today = now;
					this.render();
				}
			}, 60_000),
		);
		this.render();
		return Promise.resolve();
	}

	/** Key of the period note open in the editor, or null. */
	private currentOpenKey(): string | null {
		const file = this.app.workspace.getActiveFile();
		return file ? (periodOfFile(file, this.deps.getSettings().periodFolder)?.key ?? null) : null;
	}

	/** Redraws only when the open period note changed. */
	private syncOpenKey() {
		if (this.currentOpenKey() !== this.openKey) this.render();
	}

	private openPeriod(key: string, evt: MouseEvent | KeyboardEvent) {
		void openPeriodNote(this.app, this.deps.getSettings(), key, evt.metaKey || evt.ctrlKey);
	}

	private shiftMonth(delta: number) {
		const d = new Date(Date.UTC(this.year, this.month - 1 + delta, 1));
		this.year = d.getUTCFullYear();
		this.month = d.getUTCMonth() + 1;
		this.render();
	}

	private showToday() {
		this.year = Number(this.today.slice(0, 4));
		this.month = Number(this.today.slice(5, 7));
		this.render();
	}

	/** Note dot (a period note exists) and task status (open ring, or check when all done) under a day or week number. */
	private addMarks(cell: HTMLElement, key: string, all: ReturnType<TaskIndex['all']>) {
		const hasNote = this.app.vault.getFileByPath(periodNotePath(this.deps.getSettings().periodFolder, key)) !== null;
		const status = scheduleStatus(all, key);
		if (!hasNote && status === null) return;
		const marks = cell.createDiv({ cls: 'klaar-cal-marks' });
		if (status === 'open') marks.createSpan({ cls: 'klaar-cal-open', attr: { 'aria-label': 'Open tasks' } });
		if (status === 'done') setIcon(marks.createSpan({ cls: 'klaar-cal-done', attr: { 'aria-label': 'All tasks done' } }), 'check');
		if (hasNote) marks.createSpan({ cls: 'klaar-cal-note', attr: { 'aria-label': 'Has a note' } });
	}

	private render() {
		this.openKey = this.currentOpenKey();
		const root = this.contentEl;
		root.empty();
		const enabled = this.deps.getSettings().periods;
		root.addClass('klaar-calendar');

		const first = monthGrid(this.year, this.month)[0]?.days.find((d) => d.inMonth)?.date ?? this.today;
		const yearKey = periodOf('year', first).key;
		const monthKey = periodOf('month', first).key;
		const quarterKey = periodOf('quarter', first).key;

		const header = root.createDiv({ cls: 'klaar-cal-header' });
		const link = (text: string, key: string, cls: string) =>
			onActivate(header.createEl('a', { text, cls: `klaar-cal-link ${cls}${key === this.openKey ? ' is-open' : ''}` }), (e) => this.openPeriod(key, e));
		const monthName = MONTH_NAMES[this.month - 1] as string;
		// A disabled kind shows as plain text (month, year) or not at all (quarter).
		if (enabled.month) link(monthName, monthKey, 'klaar-cal-month');
		else header.createSpan({ text: monthName, cls: 'klaar-cal-month' });
		if (enabled.year) link(yearKey, yearKey, 'klaar-cal-year');
		else header.createSpan({ text: yearKey, cls: 'klaar-cal-year' });
		if (enabled.quarter) link(`Q${quarterKey.slice(-1)}`, quarterKey, 'klaar-cal-quarter');
		header.createDiv({ cls: 'klaar-cal-spacer' });
		const nav = header.createDiv({ cls: 'klaar-cal-nav-group' });
		const iconButton = (icon: string, label: string, onClick: () => void) => {
			const button = nav.createEl('button', { cls: 'clickable-icon', attr: { 'aria-label': label } });
			setIcon(button, icon);
			button.addEventListener('click', onClick);
		};
		iconButton('chevron-left', 'Previous month', () => this.shiftMonth(-1));
		const todayButton = nav.createEl('button', { text: 'Today', cls: 'klaar-cal-today' });
		todayButton.disabled = this.year === Number(this.today.slice(0, 4)) && this.month === Number(this.today.slice(5, 7));
		todayButton.addEventListener('click', () => this.showToday());
		iconButton('chevron-right', 'Next month', () => this.shiftMonth(1));

		const grid = root.createDiv({ cls: 'klaar-cal-grid' });
		grid.toggleClass('no-weeks', !enabled.week);
		if (enabled.week) grid.createDiv({ text: 'wk', cls: 'klaar-cal-head klaar-cal-weeknum' });
		for (const label of WEEKDAY_LABELS) grid.createDiv({ text: label, cls: 'klaar-cal-head' });

		const all = this.deps.index.all();
		for (const row of monthGrid(this.year, this.month)) {
			if (enabled.week) {
				const wk = grid.createDiv({ text: String(row.weekNumber), cls: 'klaar-cal-weeknum klaar-cal-link', attr: { 'aria-label': `Week ${row.weekNumber}` } });
				if (row.weekKey === this.openKey) wk.addClass('is-open');
				onActivate(wk, (e) => this.openPeriod(row.weekKey, e));
				this.addMarks(wk, row.weekKey, all);
			}
			for (const day of row.days) this.renderDay(grid, day, all, enabled.day);
		}
	}

	/** `openable` is false when daily notes are off: the day still takes dropped tasks but doesn't open a note. */
	private renderDay(grid: HTMLElement, day: { date: IsoDate; inMonth: boolean }, all: ReturnType<TaskIndex['all']>, openable: boolean) {
		const cell = grid.createDiv({ cls: 'klaar-cal-day', attr: { 'aria-label': day.date } });
		if (!day.inMonth) cell.addClass('is-outside');
		if (day.date === this.today) cell.addClass('is-today');
		if (day.date === this.openKey) cell.addClass('is-open');
		cell.createSpan({ text: String(Number(day.date.slice(8, 10))) });
		this.addMarks(cell, day.date, all);

		if (openable) onActivate(cell, (e) => this.openPeriod(day.date, e));
		else cell.addClass('is-static');
		cell.addEventListener('dragover', (e) => {
			if (!e.dataTransfer?.types.includes(TASK_DRAG_MIME)) return;
			e.preventDefault();
			cell.addClass('is-drop-target');
		});
		// dragleave also fires when moving onto the cell's own children; only clear on really leaving.
		cell.addEventListener('dragleave', (e) => {
			if (!cell.contains(e.relatedTarget as Node | null)) cell.removeClass('is-drop-target');
		});
		cell.addEventListener('drop', (e) => {
			cell.removeClass('is-drop-target');
			const ref = parseDragPayload(e.dataTransfer?.getData(TASK_DRAG_MIME) ?? '');
			if (!ref) return;
			e.preventDefault();
			editTask(this.app, ref, (line) => setSchedule(line, day.date)).catch(() => new Notice("Couldn't update the task."));
		});
	}
}
