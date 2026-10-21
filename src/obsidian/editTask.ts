import { App, Notice } from 'obsidian';
import { locateTaskLine, type TaskRef } from '../core/tasks';

/**
 * The only write path for task lines. Re-locates the line inside the atomic
 * read-modify-write; returns false (note untouched) if it can't be found.
 */
export async function editTask(
	app: App,
	ref: Pick<TaskRef, 'path' | 'line' | 'raw'>,
	change: (line: string) => string,
	opts: { silent?: boolean } = {},
): Promise<boolean> {
	const file = app.vault.getFileByPath(ref.path);
	let found = false;
	if (file) {
		await app.vault.process(file, (data) => {
			const lines = data.split('\n');
			const index = locateTaskLine(lines, ref);
			if (index === null) return data;
			lines[index] = change(lines[index] as string);
			found = true;
			return lines.join('\n');
		});
	}
	if (!found && !opts.silent) new Notice('That task changed since it was shown. Try again.');
	return found;
}
