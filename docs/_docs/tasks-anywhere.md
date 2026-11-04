---
title: Tasks anywhere
slug: tasks-anywhere
order: 2
headings:
  - id: date-picker
    label: The > picker
  - id: move-task
    label: Schedule task…
  - id: schedule-keys
    label: Schedule keys
  - id: date-chips
    label: Date chips
  - id: markers
    label: Markers
  - id: done-stamp
    label: Done date
  - id: tags
    label: Tags and priority
  - id: unscheduled
    label: What still needs a date
  - id: commands
    label: Commands
---

Write a task in any note: a meeting note, a project note, today's note. Klaar reads ordinary Markdown tasks, and everything it understands is something you could type by hand. To give a task a date, put a link to a period at the end of the line. Klaar writes the link for you, but you can type it by hand too. Plan on whatever horizon fits: most things belong to a week, bigger things to a month or a year, and only a few to a specific day.

![A project note with tasks in progress, next, open, done and cancelled, each with a priority pill and a date chip: Thu 29 Oct in red, Today, Week 44, Week 45, Nov 2026]({{ '/assets/project-note.webp' | relative_url }}){: .doc-section__media}

### The > picker {#date-picker}

On a task line, type `>` and pick when it's due:

- Today, Tomorrow and the next seven days by name
- This week, Next week
- This month, Next month
- This quarter, This year

Keep typing to filter the list, for example `>fri` or `>next`. Typing a full key such as `2026-W45` offers that exact period. Klaar replaces the `>` with a link like `>[[2026-10-23]]` or `>[[2026-W43]]`.

![Typing > at the end of a task in a project note opens the date picker: Today, Tomorrow and the next seven days with their dates]({{ '/assets/schedule-picker.webp' | relative_url }}){: .doc-section__media}

### Schedule task… {#move-task}

**Schedule task…** opens the same list from the command palette or the editor's right-click menu, and replaces the task's existing link. To reschedule from elsewhere:

- Use the ⋯ menu on a task in a journal note, a Klaar Table or a Klaar Board (see [Sending tasks on](#send-task)).
- Drag a task onto a day in the [calendar](#calendar).
- Drag a card to Today or This week on a [board by date](#board).

To put a task in a different note instead, use **Move task to note…** from the command palette or the right-click menu. Pick a note and Klaar moves the task, with its subtasks, to the end of it. To put it at the top instead (below any frontmatter), change **New and moved tasks go at** in Settings → Klaar; the same setting applies to **Send task to…**, Review overdue and the New task button in the Klaar Table and Board. Its schedule link stays as it is.

### Schedule keys {#schedule-keys}

| Key | Period |
| --- | --- |
| `2026-10-19` | day |
| `2026-W43` | ISO week, starting Monday |
| `2026-10` | month |
| `2026-Q4` | quarter |
| `2026` | year |

A task written straight into a journal note, without a `>` link, belongs to that note's period. A task in `Daily/2026-W43.md` is a task for week 43.

### Date chips {#date-chips}

In live preview and reading mode, a schedule link reads as a chip: Today, Tomorrow, Yesterday, `Fri 23 Oct`, `Week 43`, `Oct 2026`, `Q4 2026` or `2026`. Days and weeks outside the current year get the year too.

- A red chip is an open task whose period has passed.
- An accent chip is an open task due in the current day, week, month, quarter or year.
- Hover a chip to see the raw date, and click it to open that period's note.
- Put the cursor on it in live preview to edit the raw link.

Prefer the key itself? Set **Schedule labels** to **Date as written** in Settings → Klaar.


### Markers {#markers}

| You write | It means |
| --- | --- |
| `- [ ] text` | to do |
| `- [x] text` | done |
| `- [/] text` | in progress |
| `- [>] text` | next |
| `- [<] text` | someday |
| `- [-] text` | cancelled |
| `- [?] text` | question (experimental) |
| `- [I] text` | idea (experimental) |

Any other marker, such as `[!]` or a lower-case `[i]`, isn't a Klaar task and is left alone.

- **In progress** `[/]`: turn off **Mark in progress with [/]** to use a tag instead (see below).
- **Next** `[>]`: an open task to pick up next, with its own column on the board.
- **Someday** `[<]`: parked. It leaves the scheduled sections, the calendar and the open-task filters until you bring it back.

- **Question** `[?]` and **Idea** `[I]` (capital I): experimental, and off until you turn them on under Settings → Experimental. Like someday tasks, they stay out of the scheduled sections, Overdue, the calendar and the open-task filters. A Klaar Table finds them under Status → Questions or Ideas, and a status board gives each its own column. Tick one when it's answered or done with; it becomes an ordinary `[x]` task.

Each of these can be turned off in settings. Klaar then leaves those lines alone.

A task nested under another task is a subtask. Subtasks show everywhere, and the Bases views can hide them with **Show subtasks**.

### Done date {#done-stamp}

When you tick a task, Klaar adds ` (@done [[2026-10-23]])` to the line. Turn this off with **Add done date**. Under **Done date** you choose whether the stamp shows small and muted, as a chip, or hidden. The note text is the same either way.

### Tags and priority {#tags}

Tags listed in Settings → Klaar → Tags become coloured pills in the editor, in reading mode and in Klaar's own views. Tags you haven't listed keep your theme's look. Each listed tag has a colour and a role:

| Tag | Colour | Role |
| --- | --- | --- |
| `#p1` | red | High priority |
| `#p2` | orange | Medium priority |
| `#p3` | yellow | Low priority |
| `#bugs` | purple | Label |

The roles are Label, High priority, Medium priority, Low priority and In progress. Add your own tags, change colours, or give a tag the In progress role so it marks a task in progress instead of `[/]`.

### What still needs a date {#unscheduled}

Tasks without a link (and not in a journal note) are undated. To find them, make a [Klaar Board](#board) with **Columns** set to **Date**: they sit in the Undated column. Drag a card to Today or This week to schedule it, or to Later to pick a date. In a [Klaar Table](#table), set the **When** filter to **Undated**.

### Commands {#commands}

| Command | What it does |
| --- | --- |
| Schedule task… | Schedule or reschedule the task under the cursor. |
| Move task to note… | Move the task under the cursor, with its subtasks, to the end or top of another note (see Settings). |
| Send task to… | Send the task under the cursor, or every task in a selection, to a day, week or month. In a journal note it moves there; elsewhere it gets a link. |
| Move open tasks to… | Move every unfinished task in a journal note, with its subtasks, to another period. |
| Review overdue tasks | Go through overdue tasks one at a time, one key each. |
| Toggle in progress | Switch between open and in progress. |
| Toggle next | Switch between open and `[>]`. |
| Toggle someday | Switch between open and `[<]`. |
| Toggle question | Switch between open and `[?]`; a plain line or bullet becomes a question task. Only while questions are turned on under Settings → Experimental. |
| Toggle idea | Switch between open and `[I]`; a plain line or bullet becomes an idea task. Only while ideas are turned on under Settings → Experimental. |
| Toggle cancelled | Switch between open and `[-]`. A done task loses its done stamp. Also in the right-click menu as **Cancel task** / **Reopen task**. |
| Cycle priority | Step `#p3` → `#p2` → `#p1` → no priority. |
| Move done tasks to the bottom | Move every done task in the note, with its subtasks, under a `## Done` heading at the bottom. Klaar adds the heading if the note has none. Klaar asks first. Also in the right-click menu and the note's ⋯ menu. |
| Sort tasks | Put every task list in the note in order: in progress, next, to do, someday, questions, ideas, done, cancelled; priority tags, then schedule dates (earliest first), break ties. Subtasks move with their task. Klaar asks first. Also in the right-click menu and the note's ⋯ menu. |
| Open calendar | Show the calendar in the sidebar. |
| Open today's note | Open (or create) today's note. Also for this week, this month, this quarter and this year, for the period types you use. |
| Open previous day's note | Open the day before the journal note you have open, or yesterday from any other note. **Open next day's note** goes the other way. Also for weeks, months, quarters and years. |

The toggles (cancelled included) and **Cycle priority** work on every task in a selection, as one undo step. Klaar sets no hotkeys of its own: give any of these one in Settings → Hotkeys. Each command has an icon, so the editing ones can go on the mobile toolbar too (Settings → Mobile).
