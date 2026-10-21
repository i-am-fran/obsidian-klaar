import { App, Notice, TFile } from 'obsidian';
import { cleanFolder, periodKeyForPath, periodNotePath } from '../core/periodPaths';
import { parsePeriodKey, type Period } from '../core/periods';
import { appendTaskLine } from '../core/taskLine';
import type { KlaarSettings } from '../settings';
import { confirmCreate } from '../ui/confirmCreateModal';

export { periodNotePath };

/** The period a file represents, or null if it is not a period note in `folder`. */
export function periodOfFile(file: TFile, folder: string): Period | null {
	const key = periodKeyForPath(file.path, folder);
	return key ? parsePeriodKey(key) : null;
}

const warnedKeys = new Set<string>();

/** Opens the period note for `key`; if missing, asks first, then creates the folder and an empty file. */
export async function openPeriodNote(app: App, settings: KlaarSettings, key: string, newLeaf = false): Promise<void> {
	const path = periodNotePath(settings.periodFolder, key);
	if (!app.vault.getFileByPath(path) && !(await confirmCreate(app, path))) return;
	const file = await ensurePeriodNote(app, settings, key);

	const other = app.metadataCache.getFirstLinkpathDest(key, '');
	if (other && other.path !== file.path && !warnedKeys.has(key)) {
		warnedKeys.add(key);
		new Notice(`Another note is also named "${key}". Klaar uses ${file.path}.`);
	}

	await app.workspace.getLeaf(newLeaf).openFile(file);
}

/** Adds `text` as an open task at the end of the period note for `key`, creating the note if missing; returns its path. */
export async function addTaskToPeriodNote(app: App, settings: KlaarSettings, key: string, text: string): Promise<string> {
	const file = await ensurePeriodNote(app, settings, key);
	await app.vault.process(file, (content) => appendTaskLine(content, text));
	return file.path;
}

/** The period note for `key`, created (with its folder) as an empty file if missing. */
async function ensurePeriodNote(app: App, settings: KlaarSettings, key: string): Promise<TFile> {
	const path = periodNotePath(settings.periodFolder, key);
	const existing = app.vault.getFileByPath(path);
	if (existing) return existing;
	const folder = cleanFolder(settings.periodFolder);
	if (folder !== '' && !app.vault.getFolderByPath(folder)) await app.vault.createFolder(folder);
	return app.vault.create(path, '');
}
