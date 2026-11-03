import { App, Notice, PluginSettingTab, type Setting, type SettingDefinition, type SettingDefinitionItem, type SettingDefinitionList } from 'obsidian';
import { cleanFolder } from './core/periodPaths';
import type { EnabledPeriods, PeriodKind } from './core/periods';
import type { DateLabelStyle } from './core/dateLabels';
import { DEFAULT_TAG_RULES, ROLE_LABELS, canMarkInProgress, type TagRole, type TagRule } from './core/tagRules';
import type KlaarPlugin from './main';

export interface KlaarSettings {
	periodFolder: string;
	stampDone: boolean;
	/** Period kinds in use; the others are hidden from sections, the calendar and the date picker. */
	periods: EnabledPeriods;
	/** Set once the calendar has been auto-opened, so later launches respect where (and whether) the user keeps it. */
	calendarOpened: boolean;
	/** Remembered open/closed choice per accordion (see `stateKey`); a missing key means "use the default". */
	sectionOpen: Record<string, boolean>;
	/** `[/]` means in progress, and Klaar writes it when marking a task in progress (otherwise it adds an in-progress tag). */
	slashInProgress: boolean;
	/** `[>]` is a task to pick up next; off, Klaar ignores `[>]` lines. */
	nextMarker: boolean;
	/** `[<]` is a task parked for someday; off, Klaar ignores `[<]` lines. */
	somedayMarker: boolean;
	/** Experimental: `[?]` is a question, parked like someday; off, Klaar ignores `[?]` lines. */
	questionMarker: boolean;
	/** Experimental: `[I]` is an idea, parked like someday; off, Klaar ignores `[I]` lines. */
	ideaMarker: boolean;
	/** Tags with a colour and a meaning (priority, in progress or just a label). */
	tags: TagRule[];
	/** How schedule chips read: `Fri 23 Oct` or the raw key. */
	dateLabels: DateLabelStyle;
	/** How the `(@done [[DATE]])` stamp shows in live preview and reading mode. */
	doneStamp: DoneStampStyle;
	/** Where a moved task goes in the other note ("Move task to note…", "Send task to…", Review overdue). */
	moveTo: MovePosition;
	/** Vault path of the template a new period note of each kind starts from; '' starts it empty. */
	templates: Record<PeriodKind, string>;
}

export type DoneStampStyle = 'muted' | 'hidden' | 'chip';
export type MovePosition = 'end' | 'start';

export const DEFAULT_SETTINGS: KlaarSettings = {
	periodFolder: 'Daily',
	stampDone: true,
	periods: { day: true, week: true, month: true, quarter: false, year: true },
	calendarOpened: false,
	sectionOpen: {},
	slashInProgress: true,
	nextMarker: true,
	somedayMarker: true,
	questionMarker: false,
	ideaMarker: false,
	tags: DEFAULT_TAG_RULES.map((r) => ({ ...r })),
	dateLabels: 'friendly',
	doneStamp: 'muted',
	moveTo: 'end',
	templates: { day: '', week: '', month: '', quarter: '', year: '' },
};

const PERIOD_TOGGLES: { kind: PeriodKind; name: string }[] = [
	{ kind: 'day', name: 'Daily' },
	{ kind: 'week', name: 'Weekly' },
	{ kind: 'month', name: 'Monthly' },
	{ kind: 'quarter', name: 'Quarterly' },
	{ kind: 'year', name: 'Yearly' },
];

/** Control keys for the period toggles: `periods.day`, `periods.week`... */
const PERIOD_KEY = 'periods.';
/** Control keys for the template pickers: `templates.day`, `templates.week`... */
const TEMPLATE_KEY = 'templates.';
/** Settings that change what counts as a task or its meaning, so they re-read the index (`saveTagSettings`). */
const TAG_KEYS = new Set(['slashInProgress', 'nextMarker', 'somedayMarker', 'questionMarker', 'ideaMarker']);
/** Settings that only change how chips look (`saveDisplaySettings`). */
const DISPLAY_KEYS = new Set(['dateLabels', 'doneStamp']);

const FEEDBACK_URL = `mailto:iamfranrealm@icloud.com?subject=${encodeURIComponent('Klaar feedback')}`;
const COFFEE_URL = 'https://www.buymeacoffee.com/iamfran';

export class KlaarSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: KlaarPlugin) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'group',
				items: [
					{
						name: 'Journal notes folder',
						desc: 'Where your day, week, month, quarter and year notes live.',
						control: { type: 'folder', key: 'periodFolder', placeholder: DEFAULT_SETTINGS.periodFolder, includeRoot: true },
					},
					{
						name: 'Add done date',
						desc: 'Add the date when you tick a task.',
						control: { type: 'toggle', key: 'stampDone' },
					},
					{
						name: 'Mark in progress with [/]',
						desc: 'Off: use a tag with the in progress role.',
						control: { type: 'toggle', key: 'slashInProgress' },
					},
					{
						name: 'Mark next with [>]',
						desc: 'Tasks to pick up next.',
						control: { type: 'toggle', key: 'nextMarker' },
					},
					{
						name: 'Mark someday with [<]',
						desc: 'Parked tasks, kept out of scheduled sections and the calendar.',
						control: { type: 'toggle', key: 'somedayMarker' },
					},
					{
						name: 'New and moved tasks go at',
						desc: 'In the note a task is moved or added to. The top is below any frontmatter.',
						control: { type: 'dropdown', key: 'moveTo', options: { end: 'The end of the note', start: 'The top of the note' } },
					},
				],
			},
			{
				type: 'group',
				heading: 'Dates',
				items: [
					{
						name: 'Schedule labels',
						desc: 'Hover shows the date as written.',
						control: { type: 'dropdown', key: 'dateLabels', options: { friendly: 'Friendly (Fri 23 Oct)', key: 'Date as written (2026-10-23)' } },
					},
					{
						name: 'Done date',
						desc: 'Display only; the note keeps the date.',
						control: { type: 'dropdown', key: 'doneStamp', options: { muted: 'Small and muted', chip: 'Chip', hidden: 'Hidden' } },
					},
				],
			},
			...this.tagSection(),
			{
				type: 'group',
				heading: 'Period types',
				items: [
					...PERIOD_TOGGLES.map(({ kind, name }): SettingDefinition => ({
						name,
						control: { type: 'toggle', key: `${PERIOD_KEY}${kind}` },
					})),
					// Template pickers below the toggles, one per period type in use, introduced by a row of their own so
					// each picker reads the same. The picker's own empty text says "No file selected".
					{ name: 'Note templates', desc: 'A new journal note starts from its template, with {{title}}, {{date}} and {{date:FORMAT}} filled in.' },
					...PERIOD_TOGGLES.filter(({ kind }) => this.plugin.settings.periods[kind]).map(({ kind, name }): SettingDefinition => ({
						name: `${name} note template`,
						control: { type: 'file', key: `${TEMPLATE_KEY}${kind}`, filter: (file) => file.extension === 'md' },
					})),
				],
			},
			{
				type: 'group',
				heading: 'Experimental',
				items: [
					{
						name: 'Questions with [?]',
						desc: 'Questions to think about, kept out of scheduled sections and the calendar, with their own status and board column.',
						control: { type: 'toggle', key: 'questionMarker' },
					},
					{
						name: 'Ideas with [I]',
						desc: 'Ideas for later (capital I), kept out of scheduled sections and the calendar, with their own status and board column.',
						control: { type: 'toggle', key: 'ideaMarker' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Support',
				items: [
					{
						name: 'Send feedback',
						desc: 'Bug or missing feature? Email me.',
						render: (setting) => {
							setting.addButton((button) => button.setButtonText('Send feedback').onClick(() => window.open(FEEDBACK_URL)));
						},
					},
					{
						name: 'Buy me a coffee',
						desc: 'Klaar is free. A coffee helps me keep working on it.',
						render: (setting) => {
							setting.addButton((button) => button.setButtonText('Buy me a coffee').setCta().onClick(() => window.open(COFFEE_URL)));
						},
					},
				],
			},
		];
	}

	/**
	 * Tags: one row per tag (name, role, colour) with Obsidian's own add and delete buttons, then what tags do. The
	 * explanation is its own row because a list has no description of its own.
	 */
	private tagSection(): SettingDefinitionItem[] {
		const tags = this.plugin.settings.tags;
		const list: SettingDefinitionList = {
			type: 'list',
			heading: 'Tags',
			emptyState: 'No tags yet.',
			addItem: {
				name: 'Add tag',
				action: () => {
					tags.push({ tag: '', color: '#8e8e93', role: 'label' });
					void this.plugin.saveTagSettings();
					this.update();
				},
			},
			onDelete: (index) => {
				tags.splice(index, 1);
				void this.plugin.saveTagSettings();
				this.update();
			},
			items: tags.map((rule) => ({
				name: rule.tag === '' ? 'New tag' : `#${rule.tag}`,
				searchable: false,
				render: (setting) => this.renderTagRow(setting, rule),
			})),
		};
		return [
			list,
			{
				type: 'group',
				items: [{ name: 'Coloured tags', desc: 'Listed tags are coloured everywhere. A role sets priority or in progress. Any tag can be a board column (Configure view).' }],
			},
		];
	}

	private renderTagRow(setting: Setting, rule: TagRule): void {
		setting
			.setClass('klaar-tag-setting')
			.addText((text) =>
				text
					.setPlaceholder('Tag')
					.setValue(rule.tag)
					.onChange(async (value) => {
						rule.tag = value.trim().replace(/^#/, '');
						await this.plugin.saveTagSettings();
					}),
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(ROLE_LABELS)
					.setValue(rule.role)
					.onChange(async (value) => {
						rule.role = value as TagRole;
						await this.plugin.saveTagSettings();
					}),
			)
			.addColorPicker((picker) =>
				picker.setValue(rule.color).onChange(async (value) => {
					rule.color = value;
					await this.plugin.saveTagSettings();
				}),
			);
	}

	getControlValue(key: string): unknown {
		const settings = this.plugin.settings;
		if (key.startsWith(PERIOD_KEY)) return settings.periods[key.slice(PERIOD_KEY.length) as PeriodKind];
		if (key.startsWith(TEMPLATE_KEY)) return settings.templates[key.slice(TEMPLATE_KEY.length) as PeriodKind];
		return settings[key as keyof KlaarSettings];
	}

	/** Saves one control's value, then does what that setting needs: rebuild the index, redraw chips, or warn. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings;
		if (key.startsWith(PERIOD_KEY)) settings.periods[key.slice(PERIOD_KEY.length) as PeriodKind] = value as boolean;
		else if (key.startsWith(TEMPLATE_KEY)) settings.templates[key.slice(TEMPLATE_KEY.length) as PeriodKind] = (value as string).trim();
		else if (key === 'periodFolder') settings.periodFolder = cleanFolder(value as string);
		else (settings as unknown as Record<string, unknown>)[key] = value;

		if (TAG_KEYS.has(key)) {
			await this.plugin.saveTagSettings();
			if (key === 'slashInProgress' && !canMarkInProgress(settings.tags, settings.slashInProgress)) new Notice('To mark tasks in progress, add a tag below and set its role to in progress.');
		} else if (DISPLAY_KEYS.has(key)) {
			await this.plugin.saveDisplaySettings();
		} else {
			await this.plugin.saveSettings();
			if (key === 'periodFolder' || key.startsWith(PERIOD_KEY)) this.plugin.rebuildIndex();
			// The Templates group lists only the period types in use.
			if (key.startsWith(PERIOD_KEY)) this.update();
		}
	}
}
