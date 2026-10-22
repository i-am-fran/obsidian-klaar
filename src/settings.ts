import { App, Notice, PluginSettingTab, type Setting, type SettingDefinitionItem, type SettingDefinitionList } from 'obsidian';
import { cleanFolder } from './core/periodPaths';
import type { EnabledPeriods, PeriodKind } from './core/periods';
import type { DateLabelStyle } from './core/dateLabels';
import { DEFAULT_TAG_RULES, KIND_LABELS, ROLE_OPTIONS, canMarkInProgress, defaultRole, kindOf, type TagKind, type TagRole, type TagRule } from './core/tagRules';
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
	/** Tags with a colour and a meaning (priority, a status, or just a label). */
	tags: TagRule[];
	/** How schedule chips read: `Fri 23 Oct` or the raw key. */
	dateLabels: DateLabelStyle;
	/** How the `(@done [[DATE]])` stamp shows in live preview and reading mode. */
	doneStamp: DoneStampStyle;
}

export type DoneStampStyle = 'muted' | 'hidden' | 'chip';

export const DEFAULT_SETTINGS: KlaarSettings = {
	periodFolder: 'Daily',
	stampDone: true,
	periods: { day: true, week: true, month: true, quarter: false, year: true },
	calendarOpened: false,
	sectionOpen: {},
	slashInProgress: true,
	nextMarker: true,
	somedayMarker: true,
	tags: DEFAULT_TAG_RULES.map((r) => ({ ...r })),
	dateLabels: 'friendly',
	doneStamp: 'muted',
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
/** Settings that change what counts as a task or its meaning, so they re-read the index (`saveTagSettings`). */
const TAG_KEYS = new Set(['slashInProgress', 'nextMarker', 'somedayMarker']);
/** Settings that only change how chips look (`saveDisplaySettings`). */
const DISPLAY_KEYS = new Set(['dateLabels', 'doneStamp']);

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
						desc: 'Folder holding day, week, month, quarter and year notes.',
						control: { type: 'folder', key: 'periodFolder', placeholder: DEFAULT_SETTINGS.periodFolder, includeRoot: true },
					},
					{
						name: 'Add completed date',
						desc: 'Stamp a completed date on tasks when you tick them.',
						control: { type: 'toggle', key: 'stampDone' },
					},
					{
						name: 'Mark in progress with [/]',
						desc: 'A [/] task is in progress, and marking a task in progress writes [/]. Turn off to use a status tag set to in progress instead.',
						control: { type: 'toggle', key: 'slashInProgress' },
					},
					{
						name: 'Mark next with [>]',
						desc: 'A [>] task is one to pick up next: open, with its own column on the board. Turn off to leave [>] lines alone.',
						control: { type: 'toggle', key: 'nextMarker' },
					},
					{
						name: 'Mark someday with [<]',
						desc: 'A [<] task is parked for someday: it leaves the scheduled sections, the calendar and the open-task filters until you bring it back. Turn off to leave [<] lines alone.',
						control: { type: 'toggle', key: 'somedayMarker' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Dates',
				items: [
					{
						name: 'Schedule labels',
						desc: 'How a scheduled date reads in its chip. The raw date shows on hover either way.',
						control: { type: 'dropdown', key: 'dateLabels', options: { friendly: 'Friendly (Fri 23 Oct)', key: 'Date as written (2026-10-23)' } },
					},
					{
						name: 'Completed date',
						desc: 'How the completed date shows in live preview and reading mode. The note text is unchanged.',
						control: { type: 'dropdown', key: 'doneStamp', options: { muted: 'Small and muted', chip: 'Chip', hidden: 'Hidden' } },
					},
				],
			},
			...this.tagSection(),
			{
				type: 'group',
				heading: 'Period types',
				items: PERIOD_TOGGLES.map(({ kind, name }) => ({
					name,
					desc: `Use ${name.toLowerCase()} notes in the calendar, date picker and scheduled sections.`,
					control: { type: 'toggle', key: `${PERIOD_KEY}${kind}` },
				})),
			},
		];
	}

	/**
	 * Tags: one row per tag (name, type, level or column, colour) with Obsidian's own add and delete buttons, then what tags do. The
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
				items: [{ name: 'Coloured tags', desc: 'Tags listed above are coloured everywhere. A priority tag sets a task\'s priority. A status tag gets its own column on the status board, or marks the task in progress.' }],
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
					.addOptions(KIND_LABELS)
					.setValue(kindOf(rule.role))
					.onChange(async (value) => {
						rule.role = defaultRole(value as TagKind);
						await this.plugin.saveTagSettings();
						// Shows or swaps the second picker.
						this.update();
					}),
			);
		const options = ROLE_OPTIONS[kindOf(rule.role)];
		if (Object.keys(options).length > 0) {
			setting.addDropdown((dropdown) =>
				dropdown
					.addOptions(options)
					.setValue(rule.role)
					.onChange(async (value) => {
						rule.role = value as TagRole;
						await this.plugin.saveTagSettings();
					}),
			);
		}
		setting.addColorPicker((picker) =>
			picker.setValue(rule.color).onChange(async (value) => {
				rule.color = value;
				await this.plugin.saveTagSettings();
			}),
		);
	}

	getControlValue(key: string): unknown {
		const settings = this.plugin.settings;
		if (key.startsWith(PERIOD_KEY)) return settings.periods[key.slice(PERIOD_KEY.length) as PeriodKind];
		return settings[key as keyof KlaarSettings];
	}

	/** Saves one control's value, then does what that setting needs: rebuild the index, redraw chips, or warn. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings;
		if (key.startsWith(PERIOD_KEY)) settings.periods[key.slice(PERIOD_KEY.length) as PeriodKind] = value as boolean;
		else if (key === 'periodFolder') settings.periodFolder = cleanFolder(value as string);
		else (settings as unknown as Record<string, unknown>)[key] = value;

		if (TAG_KEYS.has(key)) {
			await this.plugin.saveTagSettings();
			if (key === 'slashInProgress' && !canMarkInProgress(settings.tags, settings.slashInProgress)) new Notice('To mark tasks in progress, add a status tag below and set it to in progress.');
		} else if (DISPLAY_KEYS.has(key)) {
			await this.plugin.saveDisplaySettings();
		} else {
			await this.plugin.saveSettings();
			if (key === 'periodFolder' || key.startsWith(PERIOD_KEY)) this.plugin.rebuildIndex();
		}
	}
}
