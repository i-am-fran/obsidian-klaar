import type { EditorView } from '@codemirror/view';
import { App, Keymap, MarkdownView, Notice, setIcon, type PaneType } from 'obsidian';
import { todayIso } from '../core/dates';
import { TASK_DRAG_MIME, encodeDragPayload } from '../core/dragPayload';
import { setChecked, setSchedule, taskMarker } from '../core/taskLine';
import type { TaskRef } from '../core/tasks';
import { editTask } from '../obsidian/editTask';
import type { KlaarSettings } from '../settings';
import { flashLine } from './flashLine';
import { openScheduleModal } from './scheduleModal';
import { renderTaskText } from './tagHighlight';

/** Lets the element be dropped on a calendar day to reschedule the task. */
export function makeDraggable(el: HTMLElement, ref: TaskRef): void {
	el.setAttr('draggable', 'true');
	el.addEventListener('dragstart', (e) => {
		e.dataTransfer?.setData(TASK_DRAG_MIME, encodeDragPayload(ref));
	});
}

/**
 * Checkbox that ticks or unticks the task in its source note. Marked up like Obsidian's editor (`data-task`, and
 * checked for any marker but a space), so the theme draws it, including its icons for `[/]` and `[-]`.
 */
export function renderCheckbox(el: HTMLElement, app: App, ref: TaskRef, settings: KlaarSettings): HTMLInputElement {
	const marker = taskMarker(ref.raw) ?? ' ';
	const box = el.createEl('input', { type: 'checkbox', cls: 'task-list-item-checkbox' });
	if (marker !== ' ') box.dataset.task = marker;
	const reset = () => (box.checked = marker !== ' ');
	reset();
	box.addEventListener('change', () => {
		editTask(app, ref, (line) => setChecked(line, !ref.checked, todayIso(), settings.stampDone))
			.then((ok) => {
				if (!ok) reset();
			})
			.catch(() => {
				reset();
				new Notice("Couldn't update the task.");
			});
	});
	return box;
}

/**
 * Opens the task's note at its line. In an editor the cursor goes to the end of the line and the line flashes;
 * reading mode only scrolls there.
 */
export async function openTaskLine(app: App, ref: TaskRef, newLeaf: PaneType | boolean): Promise<void> {
	const file = app.vault.getFileByPath(ref.path);
	if (!file) return;
	const leaf = app.workspace.getLeaf(newLeaf);
	await leaf.openFile(file, { eState: { line: ref.line } });
	const view = leaf.view;
	if (!(view instanceof MarkdownView) || view.getMode() !== 'source') return;
	const editor = view.editor;
	if (ref.line >= editor.lineCount()) return;
	const end = { line: ref.line, ch: editor.getLine(ref.line).length };
	editor.setCursor(end);
	editor.scrollIntoView({ from: end, to: end }, true);
	// Obsidian's Editor wraps the CodeMirror view as `cm`; it isn't in the public types.
	const cm = (editor as { cm?: EditorView }).cm;
	if (cm) flashLine(cm, ref.line);
}

/** Clicking `el` opens the task's note at its line (mod-click: new tab). Links inside keep their own clicks. */
export function makeOpenable(el: HTMLElement, app: App, ref: TaskRef): void {
	el.addClass('klaar-task-openable');
	el.addEventListener('click', (evt) => void openTaskLine(app, ref, Keymap.isModEvent(evt)));
}

/** Link to the source note, opening at the task's line (mod-click: new tab). */
export function renderSourceLink(el: HTMLElement, app: App, ref: TaskRef): HTMLElement {
	const file = app.vault.getFileByPath(ref.path);
	const link = el.createEl('a', { text: file?.basename ?? ref.path, cls: 'klaar-task-source' });
	link.addEventListener('click', (evt) => {
		evt.preventDefault();
		void openTaskLine(app, ref, Keymap.isModEvent(evt));
	});
	return link;
}

/** "Schedule task" button that rewrites the task's schedule link. */
export function renderMoveButton(el: HTMLElement, app: App, ref: TaskRef, settings: KlaarSettings): HTMLElement {
	const move = el.createEl('button', { cls: 'klaar-task-move clickable-icon', attr: { 'aria-label': 'Schedule task' } });
	setIcon(move, 'calendar-clock');
	move.addEventListener('click', () => {
		openScheduleModal(app, settings.periods, (key) => {
			editTask(app, ref, (line) => setSchedule(line, key)).catch(() => new Notice("Couldn't update the task."));
		});
	});
	return move;
}

/**
 * One task row: checkbox, text, optional source link, "schedule task" button; draggable onto the calendar. Clicking the
 * text opens the task's note at its line.
 */
export function renderTaskRow(el: HTMLElement, app: App, ref: TaskRef, settings: KlaarSettings, opts: { showSource: boolean }): void {
	const row = el.createDiv({ cls: 'klaar-task-row' });
	row.toggleClass('is-done', ref.checked && !ref.cancelled);
	row.toggleClass('is-cancelled', ref.cancelled);
	makeDraggable(row, ref);
	renderCheckbox(row, app, ref, settings);
	const text = row.createSpan({ cls: 'klaar-task-text' });
	makeOpenable(text, app, ref);
	renderTaskText(text, ref.text, settings.tags, app, ref.path);
	if (opts.showSource) renderSourceLink(row, app, ref);
	renderMoveButton(row, app, ref, settings);
}
