import { App, Keymap, MarkdownView, debounce } from 'obsidian';
import { todayIso } from '../core/dates';
import { groupHeading } from '../core/groupHeading';
import { defaultOpen, groupId, stateKey } from '../core/groupState';
import { groupByNote } from '../core/noteGroups';
import { scheduledFor } from '../core/query';
import { periodOfFile } from '../obsidian/periodNotes';
import type { TaskIndex } from '../obsidian/taskIndex';
import type { KlaarSettings } from '../settings';
import { renderAccordion } from './accordion';
import { renderTaskRow } from './taskRow';

export interface ScheduledSectionDeps {
	index: TaskIndex;
	getSettings: () => KlaarSettings;
	/** Persists settings after an open/closed choice changes. */
	save: () => void;
}

const SECTION_CLS = 'klaar-scheduled';

/** Renders the scheduled-tasks section above the text of every open period note. DOM only; never written to the file. */
export class ScheduledSection {
	/** Child-period sections opened this session. Their keys change with the date, so they aren't saved. */
	private openChildren = new Set<string>();
	/** Note groups the user closed this session; everything else starts open. */
	private closedNotes = new Set<string>();
	readonly refresh = debounce(() => this.renderAll(), 100, true);

	constructor(private app: App, private deps: ScheduledSectionDeps) {}

	/** Hooks the workspace and index events; `register` is the plugin's registerEvent. */
	register(register: (ref: ReturnType<App['workspace']['on']>) => void): void {
		const { workspace } = this.app;
		register(workspace.on('file-open', () => this.refresh()));
		register(workspace.on('layout-change', () => this.refresh()));
		register(workspace.on('active-leaf-change', () => this.refresh()));
		register(this.deps.index.on('updated', () => this.refresh()));
		this.refresh();
	}

	removeAll(): void {
		this.refresh.cancel();
		// Per view, not `document`: popout windows have their own document.
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			leaf.view.containerEl.querySelectorAll(`.${SECTION_CLS}`).forEach((n) => n.remove());
		}
	}

	private renderAll(): void {
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			if (leaf.view instanceof MarkdownView) this.renderView(leaf.view);
		}
	}

	/**
	 * Where the section goes: before the editor content (live preview), or at the end of the header under the title and
	 * properties (reading; the rendered blocks around it belong to Obsidian's renderer). `before` null means append.
	 */
	private anchor(view: MarkdownView): { parent: HTMLElement; before: HTMLElement | null } | null {
		const root = view.contentEl;
		if (view.getMode() === 'preview') {
			const header = root.querySelector<HTMLElement>('.markdown-reading-view .markdown-preview-sizer > .mod-header');
			return header ? { parent: header, before: null } : null;
		}
		const content = root.querySelector<HTMLElement>('.markdown-source-view .cm-contentContainer');
		return content?.parentElement ? { parent: content.parentElement, before: content } : null;
	}

	private renderView(view: MarkdownView): void {
		const settings = this.deps.getSettings();
		const file = view.file;
		const period = file ? periodOfFile(file, settings.periodFolder) : null;
		const anchor = period && file ? this.anchor(view) : null;
		const stale = Array.from(view.contentEl.querySelectorAll<HTMLElement>(`.${SECTION_CLS}`));
		if (!period || !file || !anchor || !settings.periods[period.kind]) {
			stale.forEach((n) => n.remove());
			return;
		}

		const today = todayIso();
		const groups = scheduledFor(this.deps.index.all(), period, today, file.path, settings.periods);
		if (groups.length === 0) {
			stale.forEach((n) => n.remove());
			return;
		}

		// Created in the anchor's parent, so it belongs to that window's document (popouts work); the insertBefore at
		// the end moves it into place before anything is drawn.
		const section = stale[0] ?? anchor.parent.createDiv();
		section.addClass(SECTION_CLS);
		stale.slice(1).forEach((n) => n.remove());
		section.empty();

		for (const group of groups) {
			const id = groupId(group);
			const key = stateKey(period.kind, id);
			const sectionKey = `${file.path}:${group.label}`;
			const { title, count } = groupHeading(group, period, today);
			const acc = renderAccordion(section, {
				title,
				count,
				open: id === 'child' ? this.openChildren.has(sectionKey) : (settings.sectionOpen[key] ?? defaultOpen(id)),
				cls: id === 'overdue' ? ['klaar-section', 'is-overdue'] : ['klaar-section'],
				onToggle: (open) => {
					if (id !== 'child') this.remember(key, open);
					else if (open) this.openChildren.add(sectionKey);
					else this.openChildren.delete(sectionKey);
				},
			});
			for (const note of groupByNote(group.tasks)) {
				const noteKey = `${sectionKey}|${note.path}`;
				const noteAcc = renderAccordion(acc.body, {
					title: note.name,
					open: !this.closedNotes.has(noteKey),
					cls: ['klaar-note'],
					onTitleClick: (evt) => {
						const source = this.app.vault.getFileByPath(note.path);
						if (source) void this.app.workspace.getLeaf(Keymap.isModEvent(evt)).openFile(source);
					},
					onToggle: (open) => {
						if (open) this.closedNotes.delete(noteKey);
						else this.closedNotes.add(noteKey);
					},
				});
				for (const { heading, tasks } of note.headings) {
					if (heading) noteAcc.body.createDiv({ text: heading, cls: 'klaar-task-heading' });
					for (const task of tasks) renderTaskRow(noteAcc.body, this.app, task, settings, { showSource: false });
				}
			}
		}
		if (section.parentElement !== anchor.parent || section.nextElementSibling !== anchor.before) anchor.parent.insertBefore(section, anchor.before);
	}

	private remember(key: string, open: boolean): void {
		this.deps.getSettings().sectionOpen[key] = open;
		this.deps.save();
	}
}
