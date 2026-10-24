# Klaar

[![A short tour of Klaar: a task scheduled with >, the week note listing it, and the calendar in the sidebar. Click to watch it with sound](assets/video/klaar-tour.webp)](assets/video/klaar-tour.mp4)

Klaar is a small task manager that lives in your Obsidian journal notes. You write tasks as normal checkboxes, and assign them to a day, a week, a month or a year.

- **[Install in Obsidian](https://obsidian.md/plugins?id=klaar)**
- **[Documentation](https://i-am-fran.github.io/obsidian-klaar/)**
- **[Report a bug](https://github.com/i-am-fran/obsidian-klaar/issues)**

Klaar is minimal on purpose. Your tasks stay plain Markdown checkboxes in your own notes. Klaar shows its lists when you open a journal note, and the file itself stays exactly as you wrote it. If you stop using Klaar tomorrow, nothing breaks. You'll just see a few links like `>[[2026-W43]]` at the end of some lines.

It feels like part of Obsidian rather than an app inside an app. Journal notes are just notes and the calendar is a simple sidebar. When you want a table or a board of your tasks, Klaar plugs into Bases with two views, Klaar Table and Klaar Board, instead of inventing its own query language.

In Dutch, *Klaar* means clear, and it's also what you say when something is done or ready.

## How it works

Write a task anywhere in your vault, in a meeting note, a project note or today's note. Type `>` at the end of the line and pick a day, a week, a month or a year. Klaar adds a link to that period's note:

```markdown
- [ ] Send the quarterly report #p1 >[[2026-W43]]
```

Open the week note `Daily/2026-W43.md` and the task is listed above your own text, along with what you planned for the month around it and for each day inside it. Today's note shows what's due today, what's still open this week and anything overdue. Tick a task there and it's ticked in the note where you wrote it.

## Features

**Schedule with `>`.** On a task line, type `>` and pick Today, Tomorrow, a weekday, a week, a month, a quarter or a year. The link reads as a small chip such as `Fri 23 Oct` or `Week 43`, red when the task is overdue.

<p>
  <img src="assets/screenshots/schedule-picker.webp" alt="Typing > after a task opens the date picker: Today, Tomorrow and the next seven days with their dates" width="49%">
  <img src="assets/screenshots/schedule-chips.png" alt="Scheduled tasks shown as date chips: Sat 24 Oct, Week 43, Week 44, Nov 2026, Tomorrow" width="49%">
</p>

**Journal notes that cascade.** Each day, week, month, quarter and year note lists the tasks planned for it, the ones from the period around it and the periods inside it. Today's note adds anything overdue, and folds the day's ticked tasks into a Done group.

<img src="assets/screenshots/day-note.webp" alt="A day note with Klaar: three tasks scheduled for the day, grouped by note and heading, a closed Scheduled this week section above the note's own text, and the calendar in the sidebar">

**A calendar in the sidebar.** A month view with week numbers. Click a day or a week to open its note, and drag a task onto a day to move it. A ring marks days with open tasks, a check marks days where everything is done.

<img src="assets/screenshots/calendar.webp" alt="The Klaar calendar for October 2026 with week numbers, today highlighted, and rings, checks and dots under the days and weeks" width="360">

**Tables and boards in Bases.** Klaar Table and Klaar Board show the tasks of any base, so a base for a project folder gives you that project's tasks. Drag a card to Done, In progress, a priority or a date column and Klaar changes just that line. A board by date puts everything without a date in its own Undated column.

<img src="assets/screenshots/board.webp" alt="A Klaar Board by status with To do, Next, In progress, Someday and Done columns, each card showing its date chip and note">

**Your own markers and tags.** Besides open and done, Klaar understands in progress `[/]`, next `[>]`, someday `[<]` and cancelled `[-]`. Tags like `#p1` become coloured pills, you decide which tags mean priority, and any of your tags, like `#waiting`, can be a column on a board.

| You write | It means |
|---|---|
| `- [ ]` | to do |
| `- [x]` | done |
| `- [/]` | in progress |
| `- [>]` | next |
| `- [<]` | someday |
| `- [-]` | cancelled |

Anything else, like `[!]`, isn't a Klaar task and is left alone. A task you write straight into a journal note, without a `>` link, belongs to that note's day, week or month.

The documentation has [every feature, including the little ones](https://i-am-fran.github.io/obsidian-klaar/docs.html#all-features).

## Installation

You need Obsidian 1.13.0 or newer. Klaar works on desktop and mobile.

1. In Obsidian, open Settings → Community plugins → Browse.
2. Search for **Klaar**, then install it and turn it on.
3. The calendar opens in the right sidebar. Click today to open (or create) today's note.

Other ways to install:

- **BRAT:** add `i-am-fran/obsidian-klaar` in the BRAT plugin to follow every release as soon as it's published.
- **By hand:** download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/i-am-fran/obsidian-klaar/releases/latest), put them in `<vault>/.obsidian/plugins/klaar/`, and turn on Klaar in Settings → Community plugins. If you want to check the files were built from this repository, run `gh attestation verify main.js --repo i-am-fran/obsidian-klaar`.

## Settings

Under Settings → Klaar you choose the **Journal notes folder** (`Daily` by default), which period types you use, the extra markers, your tags and colours, and how dates look. The documentation lists [every setting and its default](https://i-am-fran.github.io/obsidian-klaar/docs.html#settings).

## Themes

Klaar works with the default Obsidian theme and with Minimal, in light and dark mode. I'll test and add support for more themes over time. If something looks off in yours, please [let me know](https://github.com/i-am-fran/obsidian-klaar/issues). With the Style Settings plugin you can also tune the tag pills and the date chip colours.

## Support

Klaar is free. If it helps you, you can buy me a coffee:

<a href="https://www.buymeacoffee.com/iamfran" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="60" width="217"></a>

## Development

```
npm install
npm run dev     # watch build to main.js
npm run build   # type-check and production build
npm test        # vitest
npm run lint    # eslint
```

Changes are listed in the [changelog](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).

## Made with AI

Part of this project has been developed with the help of AI. I'm improving my development skills and it's helping me to learn new skills and review my code. If you don't like it, I understand your stance.
