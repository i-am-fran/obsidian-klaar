import { parsePeriodKey } from './periods';

/** The folder setting as a vault path: no surrounding spaces or leading/trailing slashes ('' is the vault root). */
export function cleanFolder(folder: string): string {
	return folder.trim().replace(/^\/+|\/+$/g, '');
}

/** Vault path of the note for a period key. */
export function periodNotePath(folder: string, key: string): string {
	const dir = cleanFolder(folder);
	return dir === '' ? `${key}.md` : `${dir}/${key}.md`;
}

/** The period key when `path` is a period note directly in `folder`, otherwise null. */
export function periodKeyForPath(path: string, folder: string): string | null {
	const dir = cleanFolder(folder);
	const prefix = dir === '' ? '' : `${dir}/`;
	if (!path.startsWith(prefix) || !path.endsWith('.md')) return null;
	const key = path.slice(prefix.length, -'.md'.length);
	if (key.includes('/')) return null;
	return parsePeriodKey(key) ? key : null;
}
