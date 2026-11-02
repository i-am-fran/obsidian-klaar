import { App, Menu, Notice } from 'obsidian';
import { buildDateOptions } from '../core/dateOptions';
import { todayIso } from '../core/dates';
import { appendBlock, prependBlock, toggleCancelled, toggleSomeday } from '../core/taskLine';
import { blockAt, removeLines } from '../core/taskMove';
import type { TaskRef } from '../core/tasks';
import { editTask } from '../obsidian/editTask';
import { sendTaskWithNotice } from '../obsidian/moveTask';
import type { KlaarSettings } from '../settings';
import { openNoteModal } from './noteModal';
import { openScheduleModal } from './scheduleModal';

/** The quick "Send to" targets, by label, as the date picker names them. */
const QUICK = ['Today', 'Tomorrow', 'This week', 'Next week', 'This month', 'Next month'];

/** The quick targets for today, leaving out period kinds turned off in settings. */
export function quickTargets(settings: KlaarSettings): { label: string; key: string }[] {
	const options = buildDateOptions(todayIso(), settings.periods);
	return QUICK.flatMap((label) => options.filter((o) => o.label === label));
}

/**
 * The task's menu: send it to a period (it moves when it lives in a journal note, see `sendTask`), move it to any note,
 * park it for someday or cancel it.
 */
export function showTaskMenu(evt: MouseEvent, app: App, ref: TaskRef, settings: KlaarSettings): void {
	const menu = new Menu();
	const send = (key: string) => void sendTaskWithNotice(app, settings, ref, key).catch(() => new Notice("Couldn't move the task."));
	for (const { label, key } of quickTargets(settings)) {
		menu.addItem((item) => item.setTitle(label).setIcon('calendar-arrow-right').onClick(() => send(key)));
	}
	menu.addItem((item) => item.setTitle('Pick a date…').setIcon('calendar-search').onClick(() => openScheduleModal(app, settings.periods, send)));
	menu.addSeparator();
	menu.addItem((item) => item.setTitle('Move to note…').setIcon('file-input').onClick(() => moveToNote(app, ref, settings)));
	const rewrite = (change: (line: string) => string) => void editTask(app, ref, change).catch(() => new Notice("Couldn't update the task."));
	if (settings.somedayMarker) {
		menu.addItem((item) =>
			item
				.setTitle(ref.someday ? 'Back from someday' : 'Someday')
				.setIcon('circle-arrow-left')
				.onClick(() => rewrite(toggleSomeday)),
		);
	}
	menu.addItem((item) =>
		item
			.setTitle(ref.cancelled ? 'Reopen task' : 'Cancel task')
			.setIcon(ref.cancelled ? 'circle' : 'circle-slash')
			.onClick(() => rewrite(toggleCancelled)),
	);
	menu.showAtMouseEvent(evt);
}

/** Moves the task, with its subtasks, to a note picked by name (end or top, setting `moveTo`). */
function moveToNote(app: App, ref: TaskRef, settings: KlaarSettings): void {
	openNoteModal(app, ref.path, (target) => {
		void (async () => {
			const source = app.vault.getFileByPath(ref.path);
			const block = source ? blockAt((await app.vault.read(source)).split('\n'), ref) : null;
			if (!source || !block) {
				new Notice('That task changed since it was shown. Try again.');
				return;
			}
			await app.vault.process(target, (content) => (settings.moveTo === 'start' ? prependBlock(content, block.lines) : appendBlock(content, block.lines)));
			await app.vault.process(source, (content) => {
				const lines = content.split('\n');
				const now = blockAt(lines, ref);
				return now ? removeLines(lines, now.start, now.end).join('\n') : content;
			});
			new Notice(`Moved to ${target.basename}.`);
		})().catch(() => new Notice("Couldn't move the task."));
	});
}
