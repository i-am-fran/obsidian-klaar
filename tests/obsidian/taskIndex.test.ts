import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => {
	class Events {
		trigger() {}
	}
	class MarkdownView {}
	class TFile {}
	return { Events, MarkdownView, TFile, Notice: class {}, Modal: class {}, Setting: class {}, debounce: () => () => {}, normalizePath: (p: string) => p };
});

vi.mock('../../src/core/dates', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../src/core/dates')>()),
	todayIso: () => '2026-10-19',
}));

const PATH = 'note.md';
const cache = { listItems: [{ task: ' ', position: { start: { line: 0 } } }] };

/** A fake app whose active view is `PATH` in the given mode, with its own editor buffer. */
async function setup(mode: 'source' | 'preview', editorText: string, before = '- [ ] A\n') {
	const { MarkdownView, TFile } = await import('obsidian');
	const { TaskIndex } = await import('../../src/obsidian/taskIndex');
	const file = Object.assign(new (TFile as unknown as new () => object)(), { path: PATH, extension: 'md', basename: 'note' });
	let disk = before;
	let buffer = editorText;
	const view = Object.assign(new (MarkdownView as unknown as new () => object)(), {
		file,
		getMode: () => mode,
		editor: {
			getValue: () => buffer,
			getLine: (n: number) => buffer.split('\n')[n] ?? '',
			setLine: (n: number, text: string) => {
				const lines = buffer.split('\n');
				lines[n] = text;
				buffer = lines.join('\n');
			},
		},
	});
	const app = {
		vault: {
			getMarkdownFiles: () => [file],
			cachedRead: async () => disk,
			getFileByPath: () => file,
			process: async (_f: unknown, fn: (data: string) => string) => {
				disk = fn(disk);
				return disk;
			},
		},
		metadataCache: { getFileCache: () => cache },
		workspace: { getActiveViewOfType: () => view },
	};
	const index = new TaskIndex(app as never, () => ({ periodFolder: 'Journal', stampDone: true }) as never);
	await index.build();
	const tick = async (after = '- [x] A\n') => {
		disk = after;
		(index as unknown as { onChanged: (f: unknown, d: string, c: unknown) => void }).onChanged(file, disk, cache);
		await Promise.resolve(); // let editTask's async write run
	};
	return { tick, disk: () => disk, buffer: () => buffer };
}

describe('TaskIndex done stamp', () => {
	it('stamps through the editor when ticked in editing mode', async () => {
		const t = await setup('source', '- [x] A\n');
		await t.tick();
		expect(t.buffer()).toBe('- [x] A (@done [[2026-10-19]])\n');
	});

	it('stamps the file when ticked in reading mode, whose editor buffer is stale', async () => {
		const t = await setup('preview', '- [ ] something older\n');
		await t.tick();
		expect(t.disk()).toBe('- [x] A (@done [[2026-10-19]])\n');
		expect(t.buffer()).toBe('- [ ] something older\n');
	});

	it('removes the stamp through the editor when unticked in editing mode', async () => {
		const t = await setup('source', '- [ ] A (@done [[2026-10-19]])\n', '- [x] A (@done [[2026-10-19]])\n');
		await t.tick('- [ ] A (@done [[2026-10-19]])\n');
		expect(t.buffer()).toBe('- [ ] A\n');
	});

	it('removes the stamp from the file when unticked in reading mode', async () => {
		const t = await setup('preview', '- [ ] something older\n', '- [x] A (@done [[2026-10-19]])\n');
		await t.tick('- [ ] A (@done [[2026-10-19]])\n');
		expect(t.disk()).toBe('- [ ] A\n');
	});
});
