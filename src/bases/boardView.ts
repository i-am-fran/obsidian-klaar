import { Notice, type BasesAllOptions, type BasesViewConfig, type BasesViewRegistration, type QueryController } from 'obsidian';
import { todayIso } from '../core/dates';
import { isOpen } from '../core/query';
import { TASK_DRAG_MIME, parseDragPayload } from '../core/dragPayload';
import { BOARD_BY_LABELS, BOARD_KEYS, DEFAULT_BOARD_STATE, boardColumns, boardRows, columnableTags, dropAction, enabledTagColumns, readBoardState, rewriteForColumn, rowOptions, tagColumnKey, visibleCards, type BoardBy, type BoardColumn } from '../core/taskBoard';
import { markersOf, setSchedule } from '../core/taskLine';
import { TOOLBAR_KEY, filterTasks, readTableState, sortTasks, taskTags } from '../core/taskTable';
import type { TaskRef } from '../core/tasks';
import { editTask } from '../obsidian/editTask';
import type { KlaarSettings } from '../settings';
import { renderScheduleChip } from '../ui/dateChips';
import { openScheduleModal } from '../ui/scheduleModal';
import { renderAccordion } from '../ui/accordion';
import { renderTaskText } from '../ui/tagHighlight';
import { makeDraggable, makeOpenable, renderCheckbox, renderMoveButton, renderSourceLink } from '../ui/taskRow';
import { filterOptions, sortOptions } from './labels';
import { TaskBasesView, type TasksViewDeps } from './taskBasesView';

export const BASES_VIEW_BOARD = 'klaar-board';

/** Bases view: the tasks of the notes the base selects, as columns of cards; dropping a card on a column rewrites its line. */
class BoardView extends TaskBasesView {
	readonly type = BASES_VIEW_BOARD;
	/** Columns the user asked to show in full, as `row|column`; kept for this view only, never saved. */
	private expanded = new Set<string>();
	/** Rows the user closed, by label; kept for this view only, never saved. */
	private closedRows = new Set<string>();

	constructor(controller: QueryController, containerEl: HTMLElement, deps: TasksViewDeps) {
		super(controller, containerEl, deps, { root: 'klaar-board-view', body: 'klaar-board' });
	}

	protected draw(board: HTMLElement, all: TaskRef[], query: string): number {
		const today = todayIso();
		const settings = this.deps.getSettings();
		const table = readTableState(this.get);
		const state = readBoardState(this.get);
		// Columns show status, so the table's Status filter doesn't apply here.
		const filtered = filterTasks(all, { ...table, status: 'all' }, query, today, this.noteName);
		const sorted = sortTasks(filtered, table.sort, table.reverse, this.noteName);
		const tagColumns = enabledTagColumns(this.get, settings.tags);
		const columnsOf = (tasks: TaskRef[]) => boardColumns(tasks, state.by, today, settings.tags, state.showDone, settings.slashInProgress, markersOf(settings), tagColumns);
		// The whole board's columns: the count, and whether a drop lands on the card's own column in any row.
		const columns = columnsOf(sorted);
		const rows = boardRows(sorted, state.rows, this.noteName);

		board.style.setProperty('--klaar-column-width', `${state.columnWidth}px`);
		board.toggleClass('has-rows', state.rows !== 'none');
		for (const row of rows) {
			let parent = board;
			if (state.rows !== 'none') {
				const { body } = renderAccordion(board, {
					title: row.label,
					count: row.tasks.length,
					open: !this.closedRows.has(row.label),
					cls: ['klaar-board-row'],
					onToggle: (open) => (open ? this.closedRows.delete(row.label) : this.closedRows.add(row.label)),
				});
				parent = body.createDiv({ cls: 'klaar-board-row-columns' });
			}
			for (const column of columnsOf(row.tasks)) {
				const whole = columns.find((c) => c.id === column.id) ?? column;
				this.renderColumn(parent, column, whole, `${row.label}|${column.id}`, state.by, settings, tagColumns);
			}
		}
		return columns.reduce((n, c) => n + c.tasks.length, 0);
	}

	/** One column of one row; `whole` is the same column across every row. */
	private renderColumn(parent: HTMLElement, column: BoardColumn, whole: BoardColumn, key: string, by: BoardBy, settings: KlaarSettings, tagColumns: string[]): void {
		const col = parent.createDiv({ cls: 'klaar-board-column' });
		const header = col.createDiv({ cls: 'klaar-board-column-header' });
		header.createSpan({ text: column.label, cls: 'klaar-board-column-title' });
		header.createSpan({ text: String(column.tasks.length), cls: 'klaar-board-column-count' });
		const cards = col.createDiv({ cls: 'klaar-board-cards' });
		const { shown, hidden } = visibleCards(column.tasks, this.expanded.has(key));
		for (const task of shown) this.renderCard(cards, task, settings);
		if (hidden > 0) {
			const more = cards.createEl('button', { text: `Show ${hidden} more`, cls: 'klaar-board-more' });
			more.addEventListener('click', () => {
				this.expanded.add(key);
				this.render();
			});
		}

		const action = dropAction(by, column.id, settings.periods);
		col.addEventListener('dragover', (e) => {
			if (action === 'none' || !e.dataTransfer?.types.includes(TASK_DRAG_MIME)) return;
			e.preventDefault();
			col.addClass('is-drop-target');
		});
		// dragleave also fires when moving onto the column's own children; only clear on really leaving.
		col.addEventListener('dragleave', (e) => {
			if (!col.contains(e.relatedTarget as Node | null)) col.removeClass('is-drop-target');
		});
		col.addEventListener('drop', (e) => {
			col.removeClass('is-drop-target');
			if (action === 'none') return;
			const ref = parseDragPayload(e.dataTransfer?.getData(TASK_DRAG_MIME) ?? '');
			if (!ref) return;
			e.preventDefault();
			// The payload can't be read during dragover, so a drop back on its own column (in any row) is caught here.
			if (whole.tasks.some((t) => t.path === ref.path && t.line === ref.line)) return;
			const failed = () => new Notice("Couldn't update the task.");
			if (action === 'rewrite') {
				const ctx = { today: todayIso(), rules: settings.tags, stampDone: settings.stampDone, useMarker: settings.slashInProgress, tagColumns };
				editTask(this.app, ref, (line) => rewriteForColumn(line, by, column.id, ctx)).catch(failed);
				return;
			}
			openScheduleModal(this.app, settings.periods, (key) => {
				editTask(this.app, ref, (line) => setSchedule(line, key)).catch(failed);
			});
		});
	}

	/** One card: checkbox, text, schedule chip, note link, schedule button; draggable onto columns and the calendar. */
	private renderCard(parent: HTMLElement, task: TaskRef, settings: KlaarSettings): void {
		const card = parent.createDiv({ cls: 'klaar-board-card' });
		card.toggleClass('is-done', task.checked);
		makeDraggable(card, task);
		const top = card.createDiv({ cls: 'klaar-board-card-main' });
		renderCheckbox(top, this.app, task, settings);
		const text = top.createSpan({ cls: 'klaar-board-card-text' });
		makeOpenable(text, this.app, task);
		renderTaskText(text, task.text, settings.tags, this.app, task.path);
		const meta = card.createDiv({ cls: 'klaar-board-card-meta' });
		if (task.scheduleKey) meta.appendChild(renderScheduleChip(this.app, settings, task.scheduleKey, isOpen(task)));
		renderSourceLink(meta, this.app, task);
		renderMoveButton(meta, this.app, task, settings);
	}
}

/**
 * The view's menu: columns, rows, done column, column width, a switch per plain tag to give it a column, filters and
 * sort, and whether the search bar shows.
 */
function viewOptions(config: BasesViewConfig, deps: TasksViewDeps): BasesAllOptions[] {
	const b = DEFAULT_BOARD_STATE;
	const notStatus = () => readBoardState((k) => config.get(k)).by !== 'status';
	const tags = columnableTags(deps.getSettings().tags);
	const saved = readBoardState((k) => config.get(k));
	const savedTag = readTableState((k) => config.get(k)).tag;
	return [
		{ type: 'toggle', key: TOOLBAR_KEY, displayName: 'Show search', default: true },
		{ type: 'dropdown', key: BOARD_KEYS.by, displayName: 'Columns', default: b.by, options: BOARD_BY_LABELS },
		{ type: 'dropdown', key: BOARD_KEYS.rows, displayName: 'Rows', default: b.rows, options: rowOptions(saved.by) },
		{
			type: 'toggle',
			key: BOARD_KEYS.showDone,
			displayName: 'Show done',
			default: b.showDone,
			shouldHide: notStatus,
		},
		{ type: 'slider', key: BOARD_KEYS.columnWidth, displayName: 'Column width', default: b.columnWidth, min: 200, max: 480, step: 20 },
		{
			type: 'group',
			displayName: 'Tag columns',
			items: tags.map((tag) => ({ type: 'toggle', key: tagColumnKey(tag), displayName: `#${tag}`, default: false })),
			shouldHide: () => notStatus() || tags.length === 0,
		},
		{ type: 'group', displayName: 'Filters', items: filterOptions(false, taskTags(deps.index.all()), savedTag) },
		{ type: 'group', displayName: 'Sort', items: sortOptions(false) },
	];
}

export function boardViewRegistration(deps: TasksViewDeps): BasesViewRegistration {
	return {
		name: 'Klaar Board',
		icon: 'square-kanban',
		factory: (controller, containerEl) => new BoardView(controller, containerEl, deps),
		options: (config) => viewOptions(config, deps),
	};
}
