import type { PeriodKind } from './periods';
import type { TaskGroup } from './query';

export type GroupId = 'own' | 'parent' | 'overdue' | 'child';

/** Which kind of group this is, from the labels `scheduledFor` gives them. */
export function groupId(group: TaskGroup): GroupId {
	if (group.label === 'Scheduled') return 'own';
	if (group.label === 'Overdue') return 'overdue';
	if (group.label.startsWith('Scheduled this ')) return 'parent';
	return 'child';
}

/** Settings key for a remembered open/closed choice: per note kind, so it applies to every note of that kind. */
export function stateKey(noteKind: PeriodKind, id: GroupId): string {
	return `${noteKind}:${id}`;
}

/** Child-period groups start closed to keep the top of the note compact. */
export function defaultOpen(id: GroupId): boolean {
	return id !== 'child';
}
