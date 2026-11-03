---
title: Task syntax
slug: task-syntax
order: 5
headings:
  - id: markers
    label: Markers
  - id: done-stamp
    label: Done date
  - id: tags
    label: Tags and priority
  - id: commands
    label: Commands
---

Klaar reads ordinary Markdown tasks. Everything it understands is something you could type by hand.

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
