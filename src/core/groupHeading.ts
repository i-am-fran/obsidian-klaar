import type { IsoDate } from './dates';
import type { Period } from './periods';
import { splitDone, type TaskGroup } from './query';

/** Title and open-task count for a scheduled-section group, e.g. "Scheduled for this week" and 2; done tasks count in their own group. */
export function groupHeading(group: TaskGroup, period: Period, today: IsoDate): { title: string; count: number } {
	const count = splitDone(group.tasks).open.length;
	if (group.label !== 'Scheduled') return { title: group.label, count };
	const what = period.kind === 'day' && period.key === today ? 'today' : `this ${period.kind}`;
	return { title: `Scheduled for ${what}`, count };
}
