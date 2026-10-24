import type { Extension } from '@codemirror/state';
import { Editor, EditorChange, MarkdownView, Notice, Plugin, WorkspaceLeaf, debounce } from 'obsidian';
import { CURRENT_PERIOD_LABELS } from './core/dateOptions';
import { todayIso } from './core/dates';
import { PERIOD_ORDER, adjacentPeriod, periodOf, type Period, type PeriodKind } from './core/periods';
import { DEFAULT_SETTINGS, KlaarSettings, KlaarSettingTab } from './settings';
import { TaskIndex } from './obsidian/taskIndex';
import { openPeriodNote, periodOfFile } from './obsidian/periodNotes';
import { DEFAULT_TAG_RULES, canMarkInProgress, cyclePriorityTag, normaliseTagRules, toggleInProgress } from './core/tagRules';
import { appendBlock, markersOf, moveDoneToSection, outdentBlock, parseTaskLine, prependBlock, setSchedule, taskBlockEnd, toggleCancelled, toggleNext, toggleSomeday } from './core/taskLine';
import { flashLineExtension } from './ui/flashLine';
import { DateSuggest } from './ui/dateSuggest';
import { dateChipsExtension, dateChipsPostProcessor } from './ui/dateChips';
import { HOVER_SOURCE, tagHighlightExtension, tagHighlightPostProcessor } from './ui/tagHighlight';
import { openNoteModal } from './ui/noteModal';
import { openScheduleModal } from './ui/scheduleModal';
import { CalendarView, VIEW_TYPE_CALENDAR } from './ui/calendarView';
import { ScheduledSection } from './ui/scheduledSection';
import { BASES_VIEW_BOARD, boardViewRegistration } from './bases/boardView';
import { BASES_VIEW_TASKS, tasksViewRegistration } from './bases/tasksView';

/** Command icons for opening the current period's note; commands need an icon to show in the mobile toolbar. */
const PERIOD_ICONS: Record<PeriodKind, string> = {
	day: 'calendar-check',
	week: 'calendar-range',
	month: 'calendar-days',
	quarter: 'calendar-clock',
	year: 'calendar-fold',
};

export default class KlaarPlugin extends Plugin {
	settings: KlaarSettings = { ...DEFAULT_SETTINGS };
	index!: TaskIndex;
	private scheduled!: ScheduledSection;
	/** Re-reads the vault after the folder setting changes, so implicit periods are recomputed; views refresh on 'updated'. */
	readonly rebuildIndex = debounce(() => void this.index.build(), 500, true);
	/** Registered once; its contents are swapped when display settings change (new plugin instances, so editors redraw). */
	private readonly editorExtensions: Extension[] = [];
	private readonly refreshEditors = debounce(() => {
		this.editorExtensions.splice(0, this.editorExtensions.length, ...this.buildEditorExtensions());
		this.app.workspace.updateOptions();
	}, 300, true);

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new KlaarSettingTab(this.app, this));

		this.registerEditorSuggest(new DateSuggest(this.app, () => this.settings));
		this.editorExtensions.push(...this.buildEditorExtensions());
		this.registerEditorExtension(this.editorExtensions);
		this.registerEditorExtension(flashLineExtension);
		this.registerMarkdownPostProcessor(tagHighlightPostProcessor(() => this.settings.tags));
		this.registerMarkdownPostProcessor(dateChipsPostProcessor(this.app, () => this.settings));
		// Lets the Style Settings plugin pick up the @settings block in styles.css.
		this.app.workspace.trigger('parse-style-settings');
		this.addCommand({
			// Kept from when this was "Move task to…", so hotkeys and toolbar buttons people set up still work.
			id: 'move-task',
			name: 'Schedule task…',
			icon: 'calendar-arrow-up',
			editorCheckCallback: (checking, editor) => {
				if (!this.cursorOnTask(editor)) return false;
				if (!checking) this.scheduleTaskUnderCursor(editor);
				return true;
			},
		});
		this.addCommand({
			id: 'move-task-to-note',
			name: 'Move task to note…',
			icon: 'file-input',
			editorCheckCallback: (checking, editor, ctx) => {
				if (!ctx.file || !this.cursorOnTask(editor)) return false;
				if (!checking) this.moveTaskUnderCursor(editor, ctx.file.path);
				return true;
			},
		});
		this.addCommand({
			id: 'toggle-in-progress',
			name: 'Toggle in progress',
			icon: 'circle-dashed',
			// Hidden when neither `[/]` nor an in-progress tag is set up: it would change nothing.
			editorCheckCallback: (checking, editor) =>
				canMarkInProgress(this.settings.tags, this.settings.slashInProgress) &&
				this.rewriteSelectedTasks(editor, checking, (line) => toggleInProgress(line, this.settings.tags, this.settings.slashInProgress)),
		});
		this.addCommand({
			id: 'toggle-next',
			name: 'Toggle next',
			icon: 'circle-arrow-right',
			editorCheckCallback: (checking, editor) => this.settings.nextMarker && this.rewriteSelectedTasks(editor, checking, toggleNext),
		});
		this.addCommand({
			id: 'toggle-someday',
			name: 'Toggle someday',
			icon: 'circle-arrow-left',
			editorCheckCallback: (checking, editor) => this.settings.somedayMarker && this.rewriteSelectedTasks(editor, checking, toggleSomeday),
		});
		this.addCommand({
			id: 'toggle-cancelled',
			name: 'Toggle cancelled',
			icon: 'circle-slash',
			editorCheckCallback: (checking, editor) => this.rewriteSelectedTasks(editor, checking, toggleCancelled),
		});
		this.addCommand({
			id: 'cycle-priority',
			name: 'Cycle priority',
			icon: 'flag',
			editorCheckCallback: (checking, editor) => this.rewriteSelectedTasks(editor, checking, (line) => cyclePriorityTag(line, this.settings.tags)),
		});
		this.addCommand({
			id: 'move-done-tasks',
			name: 'Move done tasks to the bottom',
			icon: 'list-checks',
			editorCheckCallback: (checking, editor) => this.moveDoneTasks(editor, checking),
		});
		// The note's "⋯" menu (desktop and mobile); only for an open note, so the move goes through its editor and can be
		// undone there. No section, so it sits with other plugins' items near the bottom. Without a leaf, the active note.
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, _source, leaf) => {
				const view = leaf?.view ?? this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!(view instanceof MarkdownView) || view.file !== file || !this.moveDoneTasks(view.editor, true)) return;
				menu.addItem((item) =>
					item.setTitle('Move done tasks to the bottom').setIcon('list-checks').onClick(() => this.moveDoneTasks(view.editor, false)),
				);
			}),
		);
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, ctx) => {
				if (this.moveDoneTasks(editor, true)) {
					menu.addItem((item) =>
						item.setTitle('Move done tasks to the bottom').setIcon('list-checks').onClick(() => this.moveDoneTasks(editor, false)),
					);
				}
				if (!this.cursorOnTask(editor)) return;
				menu.addItem((item) =>
					item.setTitle('Schedule task…').setIcon('calendar-arrow-up').onClick(() => this.scheduleTaskUnderCursor(editor)),
				);
				const path = ctx.file?.path;
				if (path !== undefined) {
					menu.addItem((item) =>
						item.setTitle('Move task to note…').setIcon('file-input').onClick(() => this.moveTaskUnderCursor(editor, path)),
					);
				}
				const cancelled = parseTaskLine(editor.getLine(editor.getCursor().line), markersOf(this.settings))?.cancelled ?? false;
				menu.addItem((item) =>
					item
						.setTitle(cancelled ? 'Reopen task' : 'Cancel task')
						.setIcon(cancelled ? 'circle' : 'circle-slash')
						.onClick(() => this.rewriteSelectedTasks(editor, false, toggleCancelled)),
				);
			}),
		);

		this.index = new TaskIndex(this.app, () => this.settings);
		this.registerView(VIEW_TYPE_CALENDAR, (leaf: WorkspaceLeaf) => new CalendarView(leaf, { index: this.index, getSettings: () => this.settings }));
		this.addRibbonIcon('calendar', 'Open calendar', () => void this.activateCalendar());
		this.addCommand({ id: 'open-calendar', name: 'Open calendar', icon: 'calendar', callback: () => void this.activateCalendar() });
		// No default hotkeys, as Obsidian asks of plugins: people set their own under Settings → Hotkeys.
		for (const kind of PERIOD_ORDER) {
			const label = CURRENT_PERIOD_LABELS[kind];
			this.addCommand({
				id: `open-${label.toLowerCase().replace(' ', '-')}`,
				name: `Open ${label.toLowerCase()}'s note`,
				icon: PERIOD_ICONS[kind],
				// Hidden for period types turned off in settings.
				checkCallback: (checking) => {
					if (!this.settings.periods[kind]) return false;
					if (!checking) void openPeriodNote(this.app, this.settings, periodOf(kind, todayIso()).key);
					return true;
				},
			});
			for (const [step, delta] of [['previous', -1], ['next', 1]] as const) {
				this.addCommand({
					id: `open-${step}-${kind}`,
					name: `Open ${step} ${kind}'s note`,
					icon: delta < 0 ? 'chevron-left' : 'chevron-right',
					checkCallback: (checking) => {
						if (!this.settings.periods[kind]) return false;
						if (!checking) void openPeriodNote(this.app, this.settings, adjacentPeriod(kind, this.browseAnchor(kind), delta).key);
						return true;
					},
				});
			}
		}

		this.registerHoverLinkSource(HOVER_SOURCE, { display: 'Klaar', defaultMod: true });
		this.registerBasesView(BASES_VIEW_TASKS, tasksViewRegistration({ index: this.index, getSettings: () => this.settings }));
		this.registerBasesView(BASES_VIEW_BOARD, boardViewRegistration({ index: this.index, getSettings: () => this.settings }));

		this.scheduled = new ScheduledSection(this.app, { index: this.index, getSettings: () => this.settings, save: () => void this.saveSettings() });
		this.app.workspace.onLayoutReady(() => {
			this.index.register((ref) => this.registerEvent(ref));
			void this.index.build();
			this.scheduled.register((ref) => this.registerEvent(ref));
			// First run only: later the user decides where (and whether) the calendar lives.
			if (!this.settings.calendarOpened) void this.openCalendarFirstTime();
		});
	}

	onunload() {
		this.rebuildIndex.cancel();
		this.scheduled.removeAll();
	}

	private async openCalendarFirstTime() {
		await this.activateCalendar();
		this.settings.calendarOpened = true;
		await this.saveSettings();
	}

	private async activateCalendar() {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0];
		const leaf = existing ?? workspace.getRightLeaf(false);
		if (!leaf) return;
		if (!existing) await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
		await workspace.revealLeaf(leaf);
	}

	private cursorOnTask(editor: Editor): boolean {
		return parseTaskLine(editor.getLine(editor.getCursor().line), markersOf(this.settings)) !== null;
	}

	/** Line numbers covered by the cursor or selections, each once. */
	private selectedLines(editor: Editor): number[] {
		const lines = new Set<number>();
		for (const sel of editor.listSelections()) {
			const from = Math.min(sel.anchor.line, sel.head.line);
			const to = Math.max(sel.anchor.line, sel.head.line);
			for (let i = from; i <= to; i++) lines.add(i);
		}
		return [...lines];
	}

	/** Applies `rewrite` to every task line under the cursor or selection, as one undo step. */
	private rewriteSelectedTasks(editor: Editor, checking: boolean, rewrite: (line: string) => string): boolean {
		const changes: EditorChange[] = [];
		for (const n of this.selectedLines(editor)) {
			const line = editor.getLine(n);
			if (!parseTaskLine(line, markersOf(this.settings))) continue;
			changes.push({ from: { line: n, ch: 0 }, to: { line: n, ch: line.length }, text: rewrite(line) });
		}
		if (changes.length === 0) return false;
		if (!checking) editor.transaction({ changes });
		return true;
	}

	/**
	 * Moves the note's done tasks under `## Done` at the bottom (see `moveDoneToSection`), as one undo step. False when
	 * there are none to move.
	 */
	private moveDoneTasks(editor: Editor, checking: boolean): boolean {
		const lines = Array.from({ length: editor.lineCount() }, (_, i) => editor.getLine(i));
		const next = moveDoneToSection(lines, markersOf(this.settings));
		if (!next) return false;
		if (checking) return true;
		// Only rewrite from the first line that changes, so the text above keeps its place.
		let first = 0;
		while (lines[first] === next[first]) first++;
		const cursor = editor.getCursor();
		const last = lines.length - 1;
		editor.transaction({
			changes: [{ from: { line: first, ch: 0 }, to: { line: last, ch: lines[last]?.length ?? 0 }, text: next.slice(first).join('\n') }],
		});
		editor.setCursor(Math.min(cursor.line, editor.lineCount() - 1), 0);
		return true;
	}

	/**
	 * Where previous and next count from: the open journal note when it is this kind or smaller (a day note's next
	 * week is the week after the one it sits in), otherwise today.
	 */
	private browseAnchor(kind: PeriodKind): Period {
		const file = this.app.workspace.getActiveViewOfType(MarkdownView)?.file;
		const note = file ? periodOfFile(file, this.settings.periodFolder) : null;
		if (note && PERIOD_ORDER.indexOf(note.kind) <= PERIOD_ORDER.indexOf(kind)) return note;
		return periodOf('day', todayIso());
	}

	/** Reschedules the task on the cursor line, through the user's own editor buffer. */
	private scheduleTaskUnderCursor(editor: Editor) {
		const lineNumber = editor.getCursor().line;
		openScheduleModal(this.app, this.settings.periods, (key) => {
			const line = editor.getLine(lineNumber);
			if (parseTaskLine(line, markersOf(this.settings))) editor.setLine(lineNumber, setSchedule(line, key));
		});
	}

	/**
	 * Moves the task on the cursor line, with its subtasks, to the end or top of another note (setting `moveTo`). The
	 * target is written first, so a failed write leaves the task where it was; the removal goes through the editor, so it
	 * can be undone there.
	 */
	private moveTaskUnderCursor(editor: Editor, sourcePath: string) {
		const start = editor.getCursor().line;
		const raw = editor.getLine(start);
		openNoteModal(this.app, sourcePath, (target) => {
			// The note may have changed while the picker was open.
			if (editor.getLine(start) !== raw) {
				new Notice('That task changed. Try again.');
				return;
			}
			const lines = Array.from({ length: editor.lineCount() }, (_, i) => editor.getLine(i));
			const end = taskBlockEnd(lines, start);
			const block = outdentBlock(lines.slice(start, end));
			this.app.vault
				.process(target, (content) => (this.settings.moveTo === 'start' ? prependBlock(content, block) : appendBlock(content, block)))
				.then(() => {
					const to = end < editor.lineCount() ? { line: end, ch: 0 } : { line: end - 1, ch: editor.getLine(end - 1).length };
					const from = end < editor.lineCount() || start === 0 ? { line: start, ch: 0 } : { line: start - 1, ch: editor.getLine(start - 1).length };
					editor.replaceRange('', from, to);
					new Notice(`Moved to ${target.basename}.`);
				})
				.catch(() => new Notice("Couldn't move the task."));
		});
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<KlaarSettings> | null;
		// Shallow merge, so `periods` and `sectionOpen` are merged on their own: older or partial data keeps the defaults.
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data, {
			periods: { ...DEFAULT_SETTINGS.periods, ...data?.periods },
			sectionOpen: { ...data?.sectionOpen },
			tags: normaliseTagRules(data?.tags ?? DEFAULT_TAG_RULES),
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private buildEditorExtensions(): Extension[] {
		return [tagHighlightExtension(() => this.settings.tags), dateChipsExtension(this.app, () => this.settings)];
	}

	/** Saves after a display setting changed: open editors redraw. */
	async saveDisplaySettings() {
		await this.saveSettings();
		this.refreshEditors();
	}

	/** Saves after a tag rule changed: task meanings are re-read and open editors recoloured. */
	async saveTagSettings() {
		await this.saveSettings();
		this.rebuildIndex();
		this.refreshEditors();
	}
}
