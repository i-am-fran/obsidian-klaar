import type { BasesAllOptions, BasesViewConfig, BasesViewRegistration, QueryController } from 'obsidian';
import { todayIso } from '../core/dates';
import { isOpen } from '../core/query';
import { ruleFor } from '../core/tagRules';
import { withoutTags } from '../core/taskFields';
import { COLUMN_KEYS, TOOLBAR_KEY, filterTasks, groupTasks, legacyKeysToSave, readColumns, readTableState, taskTags, type OptionalColumn } from '../core/taskTable';
import type { TaskRef } from '../core/tasks';
import type { KlaarSettings } from '../settings';
import { renderScheduleChip } from '../ui/dateChips';
import { renderTag, renderTaskText } from '../ui/tagHighlight';
import { makeDraggable, makeOpenable, renderCheckbox, renderMoveButton, renderSourceLink } from '../ui/taskRow';
import { filterOptions, sortOptions } from './labels';
import { TaskBasesView, type TasksViewDeps } from './taskBasesView';

export const BASES_VIEW_TASKS = 'klaar-tasks';

const COLUMN_LABELS: Record<OptionalColumn, string> = { status: 'Status', priority: 'Priority', tags: 'Tags', heading: 'Heading' };

/** One table column: header text and how to fill its cell. Optional columns name the toggle that shows them. */
interface Column {
	name: string;
	optional?: OptionalColumn;
	render: (cell: HTMLElement, task: TaskRef) => void;
}

function statusText(t: TaskRef): string {
	if (t.checked) return 'Done';
	if (t.cancelled) return 'Cancelled';
	if (t.someday) return 'Someday';
	if (t.inProgress) return 'In progress';
	return t.next ? 'Next' : '';
}

/** Bases view: every task line in the notes the base selects, filtered by its menu and search box and shown as a table. */
class TasksView extends TaskBasesView {
	readonly type = BASES_VIEW_TASKS;

	constructor(controller: QueryController, containerEl: HTMLElement, deps: TasksViewDeps) {
		super(controller, containerEl, deps, { root: 'klaar-tasks-view', body: 'klaar-table-body' });
	}

	/** Each set re-renders; once the keys are saved there is nothing left to move, so this runs once per old view. */
	protected beforeSync(): void {
		for (const [key, value] of Object.entries(legacyKeysToSave(this.get))) this.config.set(key, value);
	}

	protected draw(body: HTMLElement, all: TaskRef[], query: string): number {
		const state = readTableState(this.get);
		const tasks = filterTasks(all, state, query, todayIso(), this.noteName);
		const groups = groupTasks(tasks, state, this.noteName);
		if (groups.length === 0) {
			body.createDiv({ text: 'No tasks match', cls: 'klaar-bases-empty' });
			return 0;
		}

		const settings = this.deps.getSettings();
		const shown = readColumns(this.get);
		const columns = this.columns(settings, shown);
		const table = body.createEl('table', { cls: 'klaar-table' });
		const head = table.createEl('thead').createEl('tr');
		for (const column of columns) head.createEl('th', { text: column.name });
		for (const group of groups) {
			const tbody = table.createEl('tbody');
			if (group.label !== '') {
				tbody.createEl('tr', { cls: 'klaar-table-group' }).createEl('th', { text: group.label, attr: { colspan: String(columns.length) } });
			}
			for (const task of group.tasks) {
				const row = tbody.createEl('tr', { cls: 'klaar-table-row' });
				makeDraggable(row, task);
				for (const column of columns) column.render(row.createEl('td'), task);
			}
		}
		return tasks.length;
	}

	/** The shown columns in display order. Tags show in the task text unless a shown Priority or Tags column takes them. */
	private columns(settings: KlaarSettings, shown: Record<OptionalColumn, boolean>): Column[] {
		const isPriority = (tag: string) => ruleFor(tag, settings.tags)?.role.startsWith('priority-') ?? false;
		const inColumn = (tag: string) => (isPriority(tag) ? shown.priority : shown.tags);
		const all: Column[] = [
			{ name: '', render: (cell, task) => {
				cell.addClass('klaar-col-check');
				renderCheckbox(cell, this.app, task, settings);
			} },
			{ name: 'Task', render: (cell, task) => {
				cell.addClass('klaar-col-task');
				makeOpenable(cell, this.app, task);
				renderTaskText(cell, withoutTags(task.text, inColumn), settings.tags, this.app, task.path);
			} },
			{ name: 'Date', render: (cell, task) => {
				cell.addClass('klaar-col-date');
				if (task.scheduleKey) cell.appendChild(renderScheduleChip(this.app, settings, task.scheduleKey, isOpen(task)));
			} },
			{ name: 'Status', optional: 'status', render: (cell, task) => cell.setText(statusText(task)) },
			{ name: 'Priority', optional: 'priority', render: (cell, task) => {
				cell.addClass('klaar-col-priority');
				for (const tag of task.tags.filter(isPriority)) renderTag(cell, tag, settings.tags);
			} },
			{ name: 'Tags', optional: 'tags', render: (cell, task) => {
				cell.addClass('klaar-col-tags');
				for (const tag of task.tags.filter((t) => !isPriority(t))) renderTag(cell, tag, settings.tags);
			} },
			{ name: 'Note', render: (cell, task) => {
				renderSourceLink(cell, this.app, task);
			} },
			{ name: 'Heading', optional: 'heading', render: (cell, task) => {
				cell.addClass('klaar-col-heading');
				cell.setText(task.heading ?? '');
			} },
			{ name: '', render: (cell, task) => {
				cell.addClass('klaar-col-move');
				renderMoveButton(cell, this.app, task, settings);
			} },
		];
		return all.filter((c) => c.optional === undefined || shown[c.optional]);
	}
}

/** The view's menu: filters (the Tag filter offers every tag on a task in the vault), sort and group, columns, and whether the search bar shows. */
function viewOptions(config: BasesViewConfig, deps: TasksViewDeps): BasesAllOptions[] {
	const savedTag = readTableState((k) => config.get(k)).tag;
	return [
		{ type: 'toggle', key: TOOLBAR_KEY, displayName: 'Show search', default: true },
		{
			type: 'group',
			displayName: 'Columns',
			items: (Object.keys(COLUMN_LABELS) as OptionalColumn[]).map((c) => ({ type: 'toggle', key: COLUMN_KEYS[c], displayName: COLUMN_LABELS[c], default: false })),
		},
		{ type: 'group', displayName: 'Filters', items: filterOptions(true, taskTags(deps.index.all()), savedTag) },
		{ type: 'group', displayName: 'Sort and group', items: sortOptions(true) },
	];
}

export function tasksViewRegistration(deps: TasksViewDeps): BasesViewRegistration {
	return {
		name: 'Klaar Table',
		icon: 'list-checks',
		factory: (controller, containerEl) => new TasksView(controller, containerEl, deps),
		options: (config) => viewOptions(config, deps),
	};
}
