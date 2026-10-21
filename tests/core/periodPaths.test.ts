import { describe, expect, it } from 'vitest';
import { cleanFolder, periodKeyForPath, periodNotePath } from '../../src/core/periodPaths';

describe('cleanFolder', () => {
	it('strips leading and trailing slashes and surrounding spaces', () => {
		expect(cleanFolder('Periodic')).toBe('Periodic');
		expect(cleanFolder('/Periodic/')).toBe('Periodic');
		expect(cleanFolder('//Notes/Periodic//')).toBe('Notes/Periodic');
		expect(cleanFolder('  Periodic/ ')).toBe('Periodic');
		expect(cleanFolder('/')).toBe('');
		expect(cleanFolder('')).toBe('');
	});
});

describe('periodNotePath', () => {
	it('joins folder and key', () => {
		expect(periodNotePath('Periodic', '2026-W43')).toBe('Periodic/2026-W43.md');
	});
	it('ignores trailing slashes and supports the vault root', () => {
		expect(periodNotePath('Periodic/', '2026-10')).toBe('Periodic/2026-10.md');
		expect(periodNotePath('', '2026')).toBe('2026.md');
		expect(periodNotePath('/Periodic', '2026')).toBe('Periodic/2026.md');
	});
});

describe('periodKeyForPath', () => {
	it('returns the key for a note directly in the folder', () => {
		expect(periodKeyForPath('Periodic/2026-10-19.md', 'Periodic')).toBe('2026-10-19');
		expect(periodKeyForPath('Periodic/2026-Q4.md', 'Periodic/')).toBe('2026-Q4');
		expect(periodKeyForPath('2026.md', '')).toBe('2026');
		expect(periodKeyForPath('Periodic/2026.md', '/Periodic')).toBe('2026');
	});
	it('rejects other folders, subfolders, extensions and non-keys', () => {
		expect(periodKeyForPath('Other/2026-10-19.md', 'Periodic')).toBeNull();
		expect(periodKeyForPath('Periodic/sub/2026-10-19.md', 'Periodic')).toBeNull();
		expect(periodKeyForPath('Periodic/2026-10-19.txt', 'Periodic')).toBeNull();
		expect(periodKeyForPath('Periodic/notes.md', 'Periodic')).toBeNull();
		expect(periodKeyForPath('Periodic/2026-13.md', 'Periodic')).toBeNull();
	});
});
