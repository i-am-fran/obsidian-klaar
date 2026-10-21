import { describe, expect, it, vi } from 'vitest';

/** Methods Obsidian's View/Component call internally; a subclass that defines one by accident breaks the view. */
const LIFECYCLE = ['open', 'close', 'load', 'unload', 'setState', 'getState', 'getEphemeralState', 'setEphemeralState'];

vi.mock('obsidian', () => {
	class Component {}
	class View extends Component {}
	class ItemView extends View {}
	return { Component, View, ItemView, Notice: class {}, Modal: class {}, Setting: class {}, TFile: class {}, debounce: () => () => {}, normalizePath: (p: string) => p };
});

describe('CalendarView', () => {
	it('does not shadow Obsidian view lifecycle methods', async () => {
		const { CalendarView } = await import('../../src/ui/calendarView');
		const own = Object.getOwnPropertyNames(CalendarView.prototype);
		expect(own.filter((name) => LIFECYCLE.includes(name))).toEqual([]);
	});
});
