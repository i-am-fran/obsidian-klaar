import { App, Notice, TFile } from 'obsidian';
import { appendBlock, prependBlock, setSchedule } from '../core/taskLine';
import { blockAt, blockForPeriodNote, findBlock, insertLines, removeLines } from '../core/taskMove';
import type { TaskRef } from '../core/tasks';
import type { KlaarSettings } from '../settings';
import { editTask } from './editTask';
import { ensurePeriodNote, periodNotePath, periodOfFile } from './periodNotes';

/** What a send did, so it can be undone. */
export type SendRecord =
	| { kind: 'moved'; sourcePath: string; sourceLine: number; original: string[]; targetPath: string; placed: string[] }
	| { kind: 'rescheduled'; path: string; line: number; before: string; after: string };

/** Whether tasks in this file move physically when sent: only tasks in period notes do. */
export function movesPhysically(file: TFile, settings: KlaarSettings): boolean {
	return periodOfFile(file, settings.periodFolder) !== null;
}

/** Adds `blocks` to the period note for `key` (end or top, setting `moveTo`), creating the note if missing. */
export async function placeInPeriodNote(app: App, settings: KlaarSettings, key: string, blocks: string[][]): Promise<TFile> {
	const target = await ensurePeriodNote(app, settings, key);
	const all = blocks.flat();
	await app.vault.process(target, (content) => (settings.moveTo === 'start' ? prependBlock(content, all) : appendBlock(content, all)));
	return target;
}

/**
 * Sends a task to the period `key`. A task in a period note moves there, with its subtasks and without its schedule
 * link; a task in any other note stays and gets the link. The target is written before the source, so a failed write
 * leaves the task in both notes rather than in neither. Null when nothing changed.
 */
export async function sendTask(app: App, settings: KlaarSettings, ref: Pick<TaskRef, 'path' | 'line' | 'raw'>, key: string): Promise<SendRecord | null> {
	const source = app.vault.getFileByPath(ref.path);
	if (!source) return null;
	const targetPath = periodNotePath(settings.periodFolder, key);
	if (!movesPhysically(source, settings) || targetPath === source.path) {
		// In its own note already, the note is its date: just drop the link.
		const next = targetPath === source.path ? null : key;
		return rewriteTask(app, ref, (line) => setSchedule(line, next));
	}

	const block = blockAt((await app.vault.read(source)).split('\n'), ref);
	if (!block) {
		new Notice('That task changed since it was shown. Try again.');
		return null;
	}
	const placed = blockForPeriodNote(block.lines);
	const target = await placeInPeriodNote(app, settings, key, [placed]);
	let removedAt: number | null = null;
	await app.vault.process(source, (content) => {
		const lines = content.split('\n');
		const now = blockAt(lines, ref);
		if (!now || now.lines.join('\n') !== block.lines.join('\n')) return content;
		removedAt = now.start;
		return removeLines(lines, now.start, now.end).join('\n');
	});
	if (removedAt === null) {
		new Notice(`The task changed while moving; it is now in ${target.basename} and its old note.`);
		return null;
	}
	return { kind: 'moved', sourcePath: source.path, sourceLine: removedAt, original: block.lines, targetPath: target.path, placed };
}

/** Rewrites the task's line through `editTask`, remembering it for undo. Null when the task couldn't be found. */
export async function rewriteTask(app: App, ref: Pick<TaskRef, 'path' | 'line' | 'raw'>, change: (line: string) => string): Promise<SendRecord | null> {
	let before = ref.raw;
	let after = ref.raw;
	const ok = await editTask(app, ref, (line) => {
		before = line;
		after = change(line);
		return after;
	});
	return ok ? { kind: 'rescheduled', path: ref.path, line: ref.line, before, after } : null;
}

/** Puts a sent task back as it was. False (with a notice) when it changed since. */
export async function undoSend(app: App, record: SendRecord): Promise<boolean> {
	if (record.kind === 'rescheduled') {
		return editTask(app, { path: record.path, line: record.line, raw: record.after }, () => record.before);
	}
	const target = app.vault.getFileByPath(record.targetPath);
	const source = app.vault.getFileByPath(record.sourcePath);
	let taken = false;
	if (target && source) {
		await app.vault.process(target, (content) => {
			const lines = content.split('\n');
			const at = findBlock(lines, record.placed);
			if (at === null) return content;
			taken = true;
			return removeLines(lines, at, at + record.placed.length).join('\n');
		});
	}
	if (!taken || !source) {
		new Notice("Couldn't undo: the task changed since it was moved.");
		return false;
	}
	await app.vault.process(source, (content) => {
		const lines = content.split('\n');
		return insertLines(lines, Math.min(record.sourceLine, lines.length), record.original).join('\n');
	});
	return true;
}

/** Sends the task and says where it went, with an Undo button in the notice. */
export async function sendTaskWithNotice(app: App, settings: KlaarSettings, ref: Pick<TaskRef, 'path' | 'line' | 'raw'>, key: string): Promise<void> {
	const record = await sendTask(app, settings, ref, key);
	if (!record) return;
	const message = record.kind === 'moved' ? `Moved to ${key}.` : record.after.includes(`>[[${key}]]`) ? `Scheduled for ${key}.` : 'Schedule removed.';
	const fragment = createFragment((f) => {
		f.appendText(`${message} `);
		const undo = f.createEl('a', { text: 'Undo', href: '#' });
		undo.addEventListener('click', (e) => {
			e.preventDefault();
			notice.hide();
			void undoSend(app, record);
		});
	});
	const notice = new Notice(fragment, 6000);
}
