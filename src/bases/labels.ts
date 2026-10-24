import type { BasesOptions } from 'obsidian';
import type { MarkerFilter } from '../core/query';
import { DEFAULT_TABLE_STATE, TABLE_KEYS, type GroupKey, type SortKey, type StatusFilter, type WhenFilter } from '../core/taskTable';

/** Picker labels shared by the Bases views' toolbars and menus. The first entry of each is its default. */
export const STATUS_LABELS: Record<StatusFilter, string> = { open: 'Open tasks', done: 'Done', someday: 'Someday', cancelled: 'Cancelled', all: 'All tasks' };
export const WHEN_LABELS: Record<WhenFilter, string> = { any: 'Any date', overdue: 'Overdue', today: 'Today', 'this-week': 'This week', undated: 'Undated' };
export const MARKER_LABELS: Record<MarkerFilter, string> = { any: 'Any marker', 'in-progress': 'In progress', next: 'Next', priority: 'Priority' };
export const SORT_LABELS: Record<SortKey, string> = { date: 'Date', priority: 'Priority', note: 'Note', task: 'Task' };
export const GROUP_LABELS: Record<GroupKey, string> = { date: 'Group by date', note: 'Group by note', priority: 'Group by priority', tag: 'Group by tag', none: 'No groups' };

/** The Tag filter's choices: any tag, then `tags`, plus the saved one if no task has it any more, so the menu still shows it. */
function tagChoices(tags: string[], saved: string): Record<string, string> {
	const all = saved !== 'any' && !tags.some(t => t.toLowerCase() === saved.toLowerCase()) ? [...tags, saved] : tags;
	const choices: Record<string, string> = { any: 'Any tag' };
	for (const t of all) choices[t] = t;
	return choices;
}

/**
 * Menu entries for the When, Marker and Tag filters, with Status first when the view uses it, and Show subtasks last.
 * `tags`: what the Tag filter offers; `savedTag`: the view's current choice.
 */
export function filterOptions(withStatus: boolean, tags: string[], savedTag: string): BasesOptions[] {
	const d = DEFAULT_TABLE_STATE;
	const status: BasesOptions[] = withStatus ? [{ type: 'dropdown', key: TABLE_KEYS.status, displayName: 'Status', default: d.status, options: STATUS_LABELS }] : [];
	return [
		...status,
		{ type: 'dropdown', key: TABLE_KEYS.when, displayName: 'When', default: d.when, options: WHEN_LABELS },
		{ type: 'dropdown', key: TABLE_KEYS.marker, displayName: 'Marker', default: d.marker, options: MARKER_LABELS },
		{ type: 'dropdown', key: TABLE_KEYS.tag, displayName: 'Tag', default: d.tag, options: tagChoices(tags, savedTag) },
		{ type: 'toggle', key: TABLE_KEYS.subtasks, displayName: 'Show subtasks', default: d.subtasks },
	];
}

/** Menu entries for Sort by and Reverse sort, with Group last when the view uses it. */
export function sortOptions(withGroup: boolean): BasesOptions[] {
	const d = DEFAULT_TABLE_STATE;
	const group: BasesOptions[] = withGroup ? [{ type: 'dropdown', key: TABLE_KEYS.group, displayName: 'Group', default: d.group, options: GROUP_LABELS }] : [];
	return [
		{ type: 'dropdown', key: TABLE_KEYS.sort, displayName: 'Sort by', default: d.sort, options: SORT_LABELS },
		{ type: 'toggle', key: TABLE_KEYS.reverse, displayName: 'Reverse sort', default: d.reverse },
		...group,
	];
}
