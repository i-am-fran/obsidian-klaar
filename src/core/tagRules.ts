import { tagsOf } from './taskFields';
import { addTag, parseTaskLine, removeTags, reopenTask, setInProgressMarker, type ParsedLine, type Priority } from './taskLine';

export type TagRole = 'label' | 'priority-high' | 'priority-medium' | 'priority-low' | 'in-progress' | 'status';

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

/** What a tag is, picked first in settings; a priority or status tag then picks its level or column. */
export type TagKind = 'label' | 'priority' | 'status';

export const KIND_LABELS: Record<TagKind, string> = { label: 'Tag', priority: 'Priority', status: 'Status' };

/** The second picker for each kind; a plain tag has none. */
export const ROLE_OPTIONS: Record<TagKind, Partial<Record<TagRole, string>>> = {
	label: {},
	priority: { 'priority-high': 'High', 'priority-medium': 'Medium', 'priority-low': 'Low' },
	status: { status: 'Own column', 'in-progress': 'In progress' },
};

export function kindOf(role: TagRole): TagKind {
	if (role.startsWith('priority-')) return 'priority';
	return role === 'status' || role === 'in-progress' ? 'status' : 'label';
}

/** The role a tag gets when its kind changes: the first option of that kind. */
export function defaultRole(kind: TagKind): TagRole {
	return (Object.keys(ROLE_OPTIONS[kind])[0] as TagRole | undefined) ?? 'label';
}

const PRIORITY_OF: Partial<Record<TagRole, Priority>> = { 'priority-low': 1, 'priority-medium': 2, 'priority-high': 3 };
/** Cycle order: none, low, medium, high, then none again. */
const PRIORITY_STEPS: TagRole[] = ['priority-low', 'priority-medium', 'priority-high'];

/** The rule for a tag, given with or without `#`; the first match wins. */
export function ruleFor(tag: string, rules: TagRule[]): TagRule | undefined {
	const name = tag.replace(/^#/, '').toLowerCase();
	return rules.find((r) => r.tag.toLowerCase() === name);
}

/** Status rules (in progress, or their own column) in settings order, the first per tag. */
function statusRules(rules: TagRule[]): TagRule[] {
	return rules.filter((r, i) => (r.role === 'status' || r.role === 'in-progress') && r.tag !== '' && ruleFor(r.tag, rules) === rules[i]);
}

/** The status rules that give a tag its own board column, in settings order. */
export function statusColumns(rules: TagRule[]): TagRule[] {
	return statusRules(rules).filter((r) => r.role === 'status');
}

/**
 * What a task's tags mean: the highest priority among them, and its status. With several status tags, the one listed
 * first in settings wins: `inProgress` if that is an in-progress tag, otherwise `status` names its tag in lower case.
 */
export function meaningOf(tags: string[], rules: TagRule[]): { priority: Priority; inProgress: boolean; status: string | null } {
	let priority: Priority = 0;
	for (const tag of tags) {
		const p = PRIORITY_OF[ruleFor(tag, rules)?.role ?? 'label'] ?? 0;
		if (p > priority) priority = p;
	}
	const present = new Set(tags.map((t) => t.replace(/^#/, '').toLowerCase()));
	const winner = statusRules(rules).find((r) => present.has(r.tag.toLowerCase()));
	return {
		priority,
		inProgress: winner?.role === 'in-progress',
		status: winner?.role === 'status' ? winner.tag.toLowerCase() : null,
	};
}

/** Replaces the task's own-column status tags with `tag` (a status rule's tag), or just removes them for null. */
export function setStatusTag(line: string, tag: string | null, rules: TagRule[]): string {
	const others = tagsWithRole(rules, 'status').filter((t) => t.toLowerCase() !== tag?.toLowerCase());
	const cleared = others.length > 0 ? removeTags(line, others) : line;
	return tag === null ? cleared : addTag(cleared, tag);
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

/** In progress through the `[/]` marker (when `useMarker`, and no status tag says otherwise) or, as `meaningOf` found, a tag whose rule is "In progress". */
export function isInProgress(parsed: ParsedLine, meaning: { inProgress: boolean; status: string | null }, useMarker: boolean): boolean {
	return (useMarker && parsed.inProgress && meaning.status === null) || meaning.inProgress;
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
	// Another status tag would keep the task out of In progress, so it goes.
	const reopened = setStatusTag(reopenTask(line), null, rules);
	if (useMarker) return setInProgressMarker(reopened, true);
	const first = tags[0];
	return first === undefined ? line : addTag(reopened, first);
}

/**
 * Marks a task in progress with `[/]` (when `useMarker`) or the first in-progress tag, reopening it if it was done or
 * cancelled and dropping its other status tags. Turning it off clears both the marker and every in-progress tag. Unchanged if it is already as asked, or
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
