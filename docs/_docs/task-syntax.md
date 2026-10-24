---
title: Task syntax
slug: task-syntax
order: 5
headings:
  - id: markers
    label: Markers
  - id: done-stamp
    label: Completed date
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

Any other marker, such as `[!]`, isn't a Klaar task and is left alone.

- **In progress** `[/]`: turn off **Mark in progress with [/]** to use a tag instead (see below).
- **Next** `[>]`: an open task to pick up next, with its own column on the board.
- **Someday** `[<]`: parked. It leaves the scheduled sections, the calendar and the open-task filters until you bring it back.

Each of the three can be turned off in settings. Klaar then leaves those lines alone.

A task nested under another task is a subtask. Subtasks show everywhere, and the Bases views can hide them with **Show subtasks**.

### Completed date {#done-stamp}

When you tick a task, Klaar adds ` (@done [[2026-10-23]])` to the line. Turn this off with **Add completed date**. Under **Completed date** you choose whether the stamp shows small and muted, as a chip, or hidden. The note text is the same either way.

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
| Toggle in progress | Switch between open and in progress. |
| Toggle next | Switch between open and `[>]`. |
| Toggle someday | Switch between open and `[<]`. |
| Cycle priority | Step `#p3` → `#p2` → `#p1` → no priority. |
| Move done tasks to the bottom | Move every done task in the note, with its subtasks, under a `## Done` heading at the bottom. Klaar adds the heading if the note has none. Also in the right-click menu. |
| Open calendar | Show the calendar in the sidebar. |
| Open today's note | Open (or create) today's note. Also for this week, this month, this quarter and this year, for the period types you use. |
| Open previous day's note | Open the day before the journal note you have open, or yesterday from any other note. **Open next day's note** goes the other way. Also for weeks, months, quarters and years. |

The toggles and **Cycle priority** work on every task in a selection, as one undo step. Klaar sets no hotkeys of its own: give any of these one in Settings → Hotkeys. Each command has an icon, so the editing ones can go on the mobile toolbar too (Settings → Mobile).
