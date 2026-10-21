import { tagsOf } from './taskFields';
import { addTag, parseTaskLine, removeTags, reopenTask, setInProgressMarker, type ParsedLine, type Priority } from './taskLine';

export type TagRole = 'label' | 'priority-high' | 'priority-medium' | 'priority-low' | 'in-progress';

/** A tag the user listed in settings: its colour and what it means for a task. */
export interface TagRule {
	/** Without `#`; matched ignoring case. */
	tag: string;
	/** Hex colour, e.g. `#e5484d`. */
	color: string;
	role: TagRole;
}

export const DEFAULT_TAG_RULES: TagRule[] = [
	{ tag: 'p1', color: '#e5484d', role: 'priority-high' },
	{ tag: 'p2', color: '#f76b15', role: 'priority-medium' },
	{ tag: 'p3', color: '#ffc53d', role: 'priority-low' },
	{ tag: 'bugs', color: '#8e4ec6', role: 'label' },
];

export const ROLE_LABELS: Record<TagRole, string> = {
	label: 'Label',
	'priority-high': 'High priority',
	'priority-medium': 'Medium priority',
	'priority-low': 'Low priority',
	'in-progress': 'In progress',
};

const PRIORITY_OF: Partial<Record<TagRole, Priority>> = { 'priority-low': 1, 'priority-medium': 2, 'priority-high': 3 };
/** Cycle order: none, low, medium, high, then none again. */
const PRIORITY_STEPS: TagRole[] = ['priority-low', 'priority-medium', 'priority-high'];

/** The rule for a tag, given with or without `#`; the first match wins. */
export function ruleFor(tag: string, rules: TagRule[]): TagRule | undefined {
	const name = tag.replace(/^#/, '').toLowerCase();
	return rules.find((r) => r.tag.toLowerCase() === name);
}

/** What a task's tags mean: the highest priority among them, and whether one marks it in progress. */
export function meaningOf(tags: string[], rules: TagRule[]): { priority: Priority; inProgress: boolean } {
	let priority: Priority = 0;
	let inProgress = false;
	for (const tag of tags) {
		const role = ruleFor(tag, rules)?.role;
		if (role === undefined) continue;
		if (role === 'in-progress') inProgress = true;
		const p = PRIORITY_OF[role] ?? 0;
		if (p > priority) priority = p;
	}
	return { priority, inProgress };
}

function tagsWithRole(rules: TagRule[], role: TagRole): string[] {
	return rules.filter((r) => r.role === role).map((r) => r.tag);
}

/** The role for priority level 1–3; PRIORITY_STEPS runs low to high. */
function roleOfLevel(level: Priority): TagRole | undefined {
	return PRIORITY_STEPS[level - 1];
}

/** The priority levels (3, 2, 1) that have a rule, high first. */
export function priorityLevels(rules: TagRule[]): Priority[] {
	const levels: Priority[] = [3, 2, 1];
	return levels.filter((level) => rules.some((r) => r.role === roleOfLevel(level)));
}

/** Replaces the task's priority tags with the first tag listed for the level; 0 clears them. Unchanged if the level has no rule, or if that tag is already the line's only priority tag. */
export function setPriorityTag(line: string, level: Priority, rules: TagRule[]): string {
	const target = level === 0 ? undefined : rules.find((r) => r.role === roleOfLevel(level));
	if (level !== 0 && !target) return line;
	const parsed = parseTaskLine(line);
	if (!parsed) return line;
	const present = tagsOf(parsed.text).filter((t) => PRIORITY_STEPS.includes(ruleFor(t, rules)?.role ?? 'label'));
	if (present.length === 0 && !target) return line;
	// Already at the level (through any of its tags): leave the line as written.
	if (target && present.length === 1 && ruleFor(present[0] ?? '', rules)?.role === target.role) return line;
	const cleared = removeTags(line, PRIORITY_STEPS.flatMap((role) => tagsWithRole(rules, role)));
	return target ? addTag(cleared, target.tag) : cleared;
}

/** Steps the task's priority tag: none, low, medium, high, then none. Uses the first tag listed for each level. */
export function cyclePriorityTag(line: string, rules: TagRule[]): string {
	const steps = PRIORITY_STEPS.map((role) => rules.find((r) => r.role === role)).filter((r): r is TagRule => r !== undefined);
	if (steps.length === 0) return line;
	const parsed = parseTaskLine(line);
	if (!parsed) return line;
	const current = meaningOf(tagsOf(parsed.text), rules).priority;
	const next = steps.find((r) => (PRIORITY_OF[r.role] ?? 0) > current);
	return setPriorityTag(line, next ? (PRIORITY_OF[next.role] ?? 0) : 0, rules);
}

/** In progress through the `[/]` marker (when `useMarker`) or, as `meaningOf` found, a tag whose rule is "In progress". */
export function isInProgress(parsed: ParsedLine, meaning: { inProgress: boolean }, useMarker: boolean): boolean {
	return (useMarker && parsed.inProgress) || meaning.inProgress;
}

/** Whether Klaar has a way to mark a task in progress: the `[/]` marker, or a tag with the "In progress" role. */
export function canMarkInProgress(rules: TagRule[], useMarker: boolean): boolean {
	return useMarker || rules.some((r) => r.role === 'in-progress');
}

/** Open and already in progress. */
function openInProgress(parsed: ParsedLine, rules: TagRule[], useMarker: boolean): boolean {
	return !parsed.checked && !parsed.cancelled && !parsed.someday && isInProgress(parsed, meaningOf(tagsOf(parsed.text), rules), useMarker);
}

function applyInProgress(line: string, parsed: ParsedLine, on: boolean, rules: TagRule[], useMarker: boolean): string {
	const tags = tagsWithRole(rules, 'in-progress');
	if (!on) {
		const unmarked = setInProgressMarker(line, false);
		return tags.length > 0 ? removeTags(unmarked, tags) : unmarked;
	}
	if (openInProgress(parsed, rules, useMarker)) return line;
	if (useMarker) return setInProgressMarker(reopenTask(line), true);
	const first = tags[0];
	return first === undefined ? line : addTag(reopenTask(line), first);
}

/**
 * Marks a task in progress with `[/]` (when `useMarker`) or the first in-progress tag, reopening it if it was done or
 * cancelled. Turning it off clears both the marker and every in-progress tag. Unchanged if it is already as asked, or
 * if a tag is needed and none has the role.
 */
export function setInProgress(line: string, on: boolean, rules: TagRule[], useMarker: boolean): string {
	const parsed = parseTaskLine(line);
	return parsed ? applyInProgress(line, parsed, on, rules, useMarker) : line;
}

/** Turns in progress on (a done or cancelled task counts as off) or off; see setInProgress. */
export function toggleInProgress(line: string, rules: TagRule[], useMarker: boolean): string {
	const parsed = parseTaskLine(line);
	return parsed ? applyInProgress(line, parsed, !openInProgress(parsed, rules, useMarker), rules, useMarker) : line;
}
