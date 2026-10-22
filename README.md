# Klaar

Klaar is a small task manager that lives in your Obsidian journal notes. You write tasks as normal checkboxes, and assign them to a day, a week, a month or a year.

In Dutch, *Klaar* means clear, and it's also what you say when something is done or ready.

- **[Install in Obsidian](https://obsidian.md/plugins?id=klaar)**
- **[Documentation](https://i-am-fran.github.io/obsidian-klaar/)**
- **[Report a bug](https://github.com/i-am-fran/obsidian-klaar/issues)**

[![A short tour of Klaar: click to watch the video](assets/video/klaar-tour.jpg)](assets/video/klaar-tour.mp4)

Klaar is minimal on purpose. Your tasks stay plain Markdown checkboxes in your own notes. If you stop using Klaar tomorrow, nothing breaks. You'll just see a few links like `>[[2026-W43]]` at the end of some lines.

It feels like part of Obsidian rather than an app inside an app. Journal notes are just notes and the calendar is a simple sidebar. When you want a table or a board of your tasks, Klaar plugs into Bases with two views, Klaar Table and Klaar Board, instead of inventing its own query language.

## Why I made it

I tried a lot of task managers. Most of them do far more than I need, and I end up managing the tool instead of my work. I wanted something simple that does the few things I care about, and stays out of the way for everything else.

What I needed was a way to plan my days, just enough. Not a project management system, just a clear view of what's on today and what's coming up.

I also like planning on different horizons. Some things belong to this year, some to this month, most to this week. In Klaar, tasks cascade: the week note shows what you planned for the month around it and for each day inside it. So when I plan my week, the bigger stuff is right there, and nothing gets lost between notes.

It had to fit into Obsidian without cluttering it. Klaar doesn't write anything into your journal notes. It shows the lists when you open a note, and the file itself stays exactly as you wrote it.

It had to be quick. Assigning a task takes a second: type `>` at the end of the line and pick a day or a week. Rescheduling is the same, or you drag the task onto a day in the calendar.

And I wanted to customise things using what Obsidian already gives you. Klaar uses plain checkbox markers like `[/]` for in progress and ordinary tags like `#p1` for priority. You choose the tags and their colours, and any tag, like `#waiting`, can be a column on a board.

## How I work with it

I plan week first.

On Monday I open the week note and decide what the week is really about. During the week, tasks come up everywhere: in meeting notes, in project notes, in a random idea. I write them down right there and send them to the week with `>`.

As the days go by, I pull tasks from the week into specific days. The bigger, vaguer things sit in the month or year note, and because they show up in the week note too, I see them every time I plan.

Each morning, today's note shows what's due today, what's still open this week, and anything overdue. Tick a task there and it's ticked in the note where you wrote it.

When I want to know what still needs a date, I open a Klaar Board by date: everything without one sits in the Undated column, and dragging a card to Today or This week schedules it.

## Features

**Schedule with `>`.** On a task line, type `>` and pick Today, Tomorrow, a weekday, a week, a month, a quarter or a year. Klaar adds a link like `>[[2026-10-23]]`, which reads as a small chip such as `Fri 23 Oct` or `Week 43`, red when the task is overdue.

<p>
  <img src="assets/screenshots/schedule-picker.png" alt="Typing > on a task line opens the date picker with Today, Tomorrow and the next weekdays" width="49%">
  <img src="assets/screenshots/schedule-chips.png" alt="Scheduled tasks shown as date chips: Sat 24 Oct, Week 43, Week 44, Nov 2026, Tomorrow" width="49%">
</p>

**Journal notes that cascade.** Each day, week, month, quarter and year note lists the tasks planned for it, the ones from the period around it and the periods inside it. Today's note adds anything overdue. Tick a task there and its own note is updated.

<img src="assets/screenshots/today-note.png" alt="Today's note with Klaar: tasks scheduled for today, this week and overdue, grouped by project, and the calendar in the sidebar">

**A calendar in the sidebar.** A month view with week numbers. Click a day or a week to open its note, and drag a task onto a day to move it. A ring marks days with open tasks, a check marks days where everything is done.

<!-- Screenshot: the calendar in the right sidebar, with rings, checks and note dots on a few days and today highlighted. Save as assets/screenshots/calendar.png -->

**Tables and boards in Bases.** Klaar Table and Klaar Board show the tasks of any base, so a base for a project folder gives you that project's tasks. Drag a card to Done, In progress, a priority or a date column and Klaar changes just that line.

<img src="assets/screenshots/board.png" alt="The Klaar Board view with To do, In progress and Done columns, next to the calendar">

<!-- Screenshot: a Klaar Table grouped by date, with the search bar, the task count and a Priority column. Save as assets/screenshots/table.png -->

**Your own markers and tags.** Besides open and done, Klaar understands in progress `[/]`, next `[>]`, someday `[<]` and cancelled `[-]`. Tags like `#p1` become coloured pills, and you decide which tags mean priority.

## Getting started

You need Obsidian 1.13.0 or newer.

1. In Obsidian, open Settings → Community plugins → Browse.
2. Search for **Klaar**, then install it and turn it on.
3. The calendar opens in the right sidebar. Click today to open (or create) today's note.

Or [open Klaar on obsidian.md](https://obsidian.md/plugins?id=klaar).

Other ways to install:

- **BRAT:** add `i-am-fran/obsidian-klaar` in the BRAT plugin to follow every release as soon as it's published.
- **By hand:** download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/i-am-fran/obsidian-klaar/releases/latest), put them in `<vault>/.obsidian/plugins/klaar/`, and turn on Klaar in Settings → Community plugins. If you want to check the files were built from this repository, run `gh attestation verify main.js --repo i-am-fran/obsidian-klaar`.

### The basics

Write a task as you normally would, `- [ ] Call the plumber`, and type `>` at the end. Pick Today, Tomorrow, a weekday, a week, a month, a quarter or a year. Klaar adds a link like `>[[2026-10-23]]` and shows it as a small chip, such as `Fri 23 Oct`, `Today` or `Week 43`. It turns red when the task is overdue. You can also use **Move task to…** from the command palette or the right-click menu.

A task you write straight into a journal note, without a `>` link, belongs to that note's day, week or month.

Besides open and done, Klaar understands a few extra markers:

| You write | It means |
|---|---|
| `- [ ]` | to do |
| `- [x]` | done |
| `- [/]` | in progress |
| `- [>]` | next |
| `- [<]` | someday |
| `- [-]` | cancelled |

Anything else, like `[!]`, isn't a Klaar task and is left alone.

If you're curious about the link format: days are `2026-10-19`, weeks are `2026-W43` (ISO weeks, starting on Monday), months are `2026-10`, quarters are `2026-Q4` and years are `2026`.

The [documentation](https://i-am-fran.github.io/obsidian-klaar/docs.html) covers each part in more detail.

## Settings

You can choose the folder for your journal notes (`Daily` by default) and which ones you use: daily, weekly, monthly, quarterly and yearly. Quarterly is off to start with. You can also add a completed date when you tick a task, turn the extra markers on or off, pick your own tags and colours, and change how the date chips look.

## Themes

Klaar works with the default Obsidian theme and with Minimal. I'll test and add support for more themes over time. If something looks off in yours, please [let me know](https://github.com/i-am-fran/obsidian-klaar/issues). With the Style Settings plugin you can also tune the tag pills and the date chip colours.

## All features

**Scheduling**

- `>` date picker on any task line
- Today, Tomorrow and the next seven days by name
- This week, Next week, This month, Next month, This quarter, This year
- Type a full key, like `2026-W45`, to pick that exact period
- **Move task to…** from the command palette or the right-click menu
- Drag a task onto a calendar day to reschedule it
- Tasks in a journal note belong to that note's period without a link
- Date chips: Today, Tomorrow, Yesterday, `Fri 23 Oct`, `Week 43`, `Oct 2026`, `Q4 2026`, `2026`
- Red chips for overdue tasks, accent chips for the current period
- Hover a chip for the raw date, click it to open its note
- Date chips can show the date as written instead

**Journal notes**

- Day, week, month, quarter and year notes
- Tasks scheduled for the note's period
- Tasks from the period around it ("Scheduled this week")
- Tasks from the periods inside it, closed to start
- Overdue tasks on today's note
- A Done group for the day's ticked tasks
- Grouped by note, then by heading
- Open and closed sections are remembered
- Click a note's name to open it, Cmd/Ctrl-click for a new tab
- Click a task to jump to its line, which flashes
- Tick a task to update its own note
- A move button on every task
- Asks before creating a missing note
- Nothing is written into your notes

**Calendar**

- Month view in the sidebar with ISO week numbers
- Click a day, week, month, quarter or year to open its note
- Ring for open tasks, check when all are done, dot when a note exists
- Previous, next and Today buttons
- Opens by itself the first time, then stays where you put it
- **Open calendar** command and ribbon icon
- Works with the keyboard

**Tasks**

- In progress `[/]`, next `[>]`, someday `[<]` and cancelled `[-]`
- Each extra marker can be turned off
- Someday tasks leave the scheduled lists and the calendar
- Completed date stamp `(@done [[2026-10-23]])`, shown muted, as a chip or hidden
- **Toggle in progress**, **Toggle next**, **Toggle someday** and **Cycle priority** commands
- Commands work on every task in a selection
- Coloured tag pills in the editor, reading mode and Klaar's views
- Tag roles: label, high, medium or low priority, in progress
- Links, bold, italic, highlights and code render in task text
- Subtasks are recognised

**Bases views**

- Klaar Table: Task, Date and Note columns
- Optional Status, Priority, Tags and Heading columns
- Filters: Status, When (Overdue, Today, This week, Undated), Marker, Show subtasks
- Sort by date, priority, note or task, reversed if you like
- Group by date, note or priority
- Search tasks, tags and note names
- Task count, "n of m" while filtering
- **New task** button that adds to today's note
- **Today** button that opens today's note (desktop)
- Klaar Board by status, priority or date
- Tag columns per board, like Waiting or Blocked
- Show or hide the Done column
- Adjustable column width
- Long columns show the first 100 cards
- Drag a card to change only its line
- Drag rows and cards onto the calendar

**Everywhere**

- Works on desktop and mobile
- Light and dark themes
- Respects reduced motion
- Style Settings: pill tint, text strength, corner radius, weight, date chip colours
- No network requests

## Privacy and bugs

Klaar only reads the Markdown files in your vault, on your device. It never connects to the internet. If you find a bug, please [open an issue](https://github.com/i-am-fran/obsidian-klaar/issues).

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

To release, bump the version with `npm version <version> --no-git-tag-version` and add a `## <version>` section to `CHANGELOG.md`. When that reaches `main`, the Release workflow tags it and publishes the release.

## License

MIT. See [LICENSE](LICENSE).
