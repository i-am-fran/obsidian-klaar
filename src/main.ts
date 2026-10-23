import type { Extension } from '@codemirror/state';
import { Editor, EditorChange, Plugin, WorkspaceLeaf, debounce } from 'obsidian';
import { CURRENT_PERIOD_LABELS } from './core/dateOptions';
import { todayIso } from './core/dates';
import { PERIOD_ORDER, periodOf, type PeriodKind } from './core/periods';
import { DEFAULT_SETTINGS, KlaarSettings, KlaarSettingTab } from './settings';
import { TaskIndex } from './obsidian/taskIndex';
import { openPeriodNote } from './obsidian/periodNotes';
import { DEFAULT_TAG_RULES, canMarkInProgress, cyclePriorityTag, normaliseTagRules, toggleInProgress } from './core/tagRules';
import { markersOf, parseTaskLine, setSchedule, toggleNext, toggleSomeday } from './core/taskLine';
import { flashLineExtension } from './ui/flashLine';
import { DateSuggest } from './ui/dateSuggest';
import { dateChipsExtension, dateChipsPostProcessor } from './ui/dateChips';
import { HOVER_SOURCE, tagHighlightExtension, tagHighlightPostProcessor } from './ui/tagHighlight';
import { openMoveModal } from './ui/moveModal';
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
			id: 'move-task',
			name: 'Move task to…',
			icon: 'calendar-arrow-up',
			editorCheckCallback: (checking, editor) => {
				if (!this.cursorOnTask(editor)) return false;
				if (!checking) this.moveTaskUnderCursor(editor);
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
			id: 'cycle-priority',
			name: 'Cycle priority',
			icon: 'flag',
			editorCheckCallback: (checking, editor) => this.rewriteSelectedTasks(editor, checking, (line) => cyclePriorityTag(line, this.settings.tags)),
		});
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				if (!this.cursorOnTask(editor)) return;
				menu.addItem((item) =>
					item.setTitle('Move task to…').setIcon('calendar-arrow-up').onClick(() => this.moveTaskUnderCursor(editor)),
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

	/** Reschedules the task on the cursor line, through the user's own editor buffer. */
	private moveTaskUnderCursor(editor: Editor) {
		const lineNumber = editor.getCursor().line;
		openMoveModal(this.app, this.settings.periods, (key) => {
			const line = editor.getLine(lineNumber);
			if (parseTaskLine(line, markersOf(this.settings))) editor.setLine(lineNumber, setSchedule(line, key));
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
