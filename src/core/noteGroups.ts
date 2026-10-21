import type { TaskRef } from './tasks';

export interface HeadingGroup {
	/** Null for tasks above the note's first heading. */
	heading: string | null;
	tasks: TaskRef[];
}

export interface NoteGroup {
	path: string;
	name: string;
	headings: HeadingGroup[];
}

/** File name without folders or the `.md` extension. */
export function noteName(path: string): string {
	return (path.split('/').pop() ?? path).replace(/\.md$/, '');
}

/** Groups tasks by note (sorted by name), then by heading in document order, then by line. */
export function groupByNote(tasks: TaskRef[]): NoteGroup[] {
	const byPath = new Map<string, TaskRef[]>();
	for (const t of tasks) byPath.set(t.path, [...(byPath.get(t.path) ?? []), t]);

	const groups: NoteGroup[] = [];
	for (const [path, list] of byPath) {
		const name = noteName(path);
		const lowerName = name.toLowerCase();
		const sorted = [...list].sort((a, b) => a.line - b.line);
		const headings: HeadingGroup[] = [];
		for (const t of sorted) {
			// A heading that just repeats the note name (usually its title) adds nothing under the note's own header.
			const heading = t.heading?.toLowerCase() === lowerName ? null : t.heading;
			const last = headings[headings.length - 1];
			// Sorted by line, so a heading's tasks are contiguous; a repeated heading text starts a new group only if another came between.
			if (last && last.heading === heading) last.tasks.push(t);
			else headings.push({ heading, tasks: [t] });
		}
		groups.push({ path, name, headings });
	}
	return groups.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path));
}
