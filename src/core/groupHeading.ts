import type { IsoDate } from './dates';
import type { Period } from './periods';
import type { TaskGroup } from './query';

/** Title and task count for a scheduled-section group, e.g. "Scheduled for this week" and 2. */
export function groupHeading(group: TaskGroup, period: Period, today: IsoDate): { title: string; count: number } {
	const count = group.tasks.length;
	if (group.label !== 'Scheduled') return { title: group.label, count };
	const what = period.kind === 'day' && period.key === today ? 'today' : `this ${period.kind}`;
	return { title: `Scheduled for ${what}`, count };
}
