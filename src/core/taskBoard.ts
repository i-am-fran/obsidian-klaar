import type { IsoDate } from './dates';
import { periodOf } from './periods';
import type { EnabledPeriods } from './periods';
import { isOpen, isOverdue, taskPeriod } from './query';
import { canMarkInProgress, priorityLevels, setInProgress, setPriorityTag } from './tagRules';
import type { TagRule } from './tagRules';
import { ALL_MARKERS, parseTaskLine, reopenTask, setChecked, setOpenMarker, setSchedule } from './taskLine';
import type { MarkerSettings, Priority } from './taskLine';
import { matchesWhen } from './taskTable';
import type { TaskRef } from './tasks';

export type BoardBy = 'status' | 'priority' | 'date';
export type ColumnId = 'todo' | 'next' | 'in-progress' | 'someday' | 'done' | 'high' | 'medium' | 'low' | 'none' | 'overdue' | 'today' | 'this-week' | 'later' | 'undated';

export interface BoardColumn {
	id: ColumnId;
	label: string;
	tasks: TaskRef[];
}

/** What the Task board toolbar shows, saved per view. */
export interface BoardState {
	by: BoardBy;
	showDone: boolean;
	columnWidth: number;
}

/** Config keys the board saves under; prefixed so they never clash with Bases' own keys. */
export const BOARD_KEYS = { by: 'klaarBoardBy', showDone: 'klaarShowDone', columnWidth: 'klaarColumnWidth' } as const;

export const DEFAULT_BOARD_STATE: BoardState = { by: 'status', showDone: true, columnWidth: 280 };

/** Names for each board kind, for the Columns pickers. */
export const BOARD_BY_LABELS: Record<BoardBy, string> = { status: 'Status', priority: 'Priority', date: 'Date' };

const BOARD_BYS: BoardBy[] = ['status', 'priority', 'date'];
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

const LABELS: Record<ColumnId, string> = {
	'todo': 'To do', 'next': 'Next', 'in-progress': 'In progress', 'someday': 'Someday', 'done': 'Done',
	'high': 'High', 'medium': 'Medium', 'low': 'Low', 'none': 'No priority',
	'overdue': 'Overdue', 'today': 'Today', 'this-week': 'This week', 'later': 'Later', 'undated': 'Undated',
};

const PRIORITY_IDS: Partial<Record<Priority, ColumnId>> = { 3: 'high', 2: 'medium', 1: 'low' };
const PRIORITY_OF_ID: Partial<Record<ColumnId, Priority>> = { high: 3, medium: 2, low: 1, none: 0 };

/** Reads saved board choices; anything unusable falls back to the default, and the width is kept within 200-480. */
export function readBoardState(get: (key: string) => unknown): BoardState {
	const d = DEFAULT_BOARD_STATE;
	const by = BOARD_BYS.find(b => b === get(BOARD_KEYS.by));
	const showDone = get(BOARD_KEYS.showDone);
	const width = get(BOARD_KEYS.columnWidth);
	return {
		by: by ?? d.by,
		showDone: typeof showDone === 'boolean' ? showDone : d.showDone,
		columnWidth: typeof width === 'number' && Number.isFinite(width) ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)) : d.columnWidth,
	};
}

function column(id: ColumnId, tasks: TaskRef[]): BoardColumn {
	return { id, label: LABELS[id], tasks };
}

function dateBucket(t: TaskRef, today: IsoDate): ColumnId {
	if (isOverdue(t, today)) return 'overdue';
	if (t.scheduleKey === today) return 'today';
	if (matchesWhen(t, 'this-week', today)) return 'this-week';
	return taskPeriod(t) === null ? 'undated' : 'later';
}

/**
 * The board's columns in display order, empty ones included so they can take drops. Cancelled tasks never show, and
 * someday tasks only in their own column. `useMarker`: `[/]` means in progress; `markers`: whether `[>]` and `[<]` are in use.
 */
export function boardColumns(tasks: TaskRef[], by: BoardBy, today: IsoDate, rules: TagRule[], showDone: boolean, useMarker: boolean, markers: MarkerSettings = ALL_MARKERS): BoardColumn[] {
	switch (by) {
		case 'status': {
			const hasInProgress = canMarkInProgress(rules, useMarker);
			// A task both next and tagged in progress goes under In progress: work already started.
			const inProgress = (t: TaskRef) => hasInProgress && t.inProgress;
			const next = (t: TaskRef) => markers.next && t.next && !inProgress(t);
			const columns = [column('todo', tasks.filter(t => isOpen(t) && !inProgress(t) && !next(t)))];
			if (markers.next) columns.push(column('next', tasks.filter(t => isOpen(t) && next(t))));
			if (hasInProgress) columns.push(column('in-progress', tasks.filter(t => isOpen(t) && inProgress(t))));
			if (markers.someday) columns.push(column('someday', tasks.filter(t => t.someday)));
			if (showDone) columns.push(column('done', tasks.filter(t => t.checked)));
			return columns;
		}
		case 'priority': {
			const open = tasks.filter(isOpen);
			const levels = priorityLevels(rules).flatMap(level => {
				const id = PRIORITY_IDS[level];
				return id ? [column(id, open.filter(t => t.priority === level))] : [];
			});
			return [...levels, column('none', open.filter(t => t.priority === 0))];
		}
		case 'date': {
			const open = tasks.filter(isOpen);
			const ids: ColumnId[] = ['overdue', 'today', 'this-week', 'later', 'undated'];
			return ids.map(id => column(id, open.filter(t => dateBucket(t, today) === id)));
		}
	}
}

export type DropAction = 'rewrite' | 'pick' | 'none';

/** What dropping a card on a column does: rewrite the line, ask for a date, or nothing. */
export function dropAction(by: BoardBy, id: ColumnId, enabled: EnabledPeriods): DropAction {
	if (by !== 'date') return 'rewrite';
	switch (id) {
		case 'overdue':
			return 'none';
		case 'today':
			return enabled.day ? 'rewrite' : 'pick';
		case 'this-week':
			return enabled.week ? 'rewrite' : 'pick';
		case 'undated':
			return 'rewrite';
		default:
			return 'pick';
	}
}

/** The task line after its card is dropped on a column. Columns that need a date picker leave the line unchanged. */
export function rewriteForColumn(line: string, by: BoardBy, id: ColumnId, ctx: { today: IsoDate; rules: TagRule[]; stampDone: boolean; useMarker: boolean }): string {
	const { today, rules, stampDone, useMarker } = ctx;
	if (by === 'priority') {
		const level = PRIORITY_OF_ID[id];
		return level === undefined ? line : setPriorityTag(line, level, rules);
	}
	if (by === 'date') {
		if (id === 'today') return setSchedule(line, today);
		if (id === 'this-week') return setSchedule(line, periodOf('week', today).key);
		if (id === 'undated') return setSchedule(line, null);
		return line;
	}
	switch (id) {
		case 'done': {
			const cleared = setInProgress(line, false, rules, useMarker);
			return parseTaskLine(cleared)?.checked ? cleared : setChecked(cleared, true, today, stampDone);
		}
		case 'todo':
			return setOpenMarker(setInProgress(reopenTask(line), false, rules, useMarker), ' ');
		case 'next':
			return setOpenMarker(setInProgress(reopenTask(line), false, rules, useMarker), '>');
		case 'someday':
			return setOpenMarker(setInProgress(reopenTask(line), false, rules, useMarker), '<');
		case 'in-progress':
			return setInProgress(line, true, rules, useMarker);
		default:
			return line;
	}
}

/** Cards a column draws before asking; keeps a board over thousands of done tasks quick to redraw. */
export const CARD_LIMIT = 100;

/** The cards a column draws, and how many more it holds; an expanded column draws them all. */
export function visibleCards(tasks: TaskRef[], expanded: boolean, limit = CARD_LIMIT): { shown: TaskRef[]; hidden: number } {
	if (expanded || tasks.length <= limit) return { shown: tasks, hidden: 0 };
	return { shown: tasks.slice(0, limit), hidden: tasks.length - limit };
}
