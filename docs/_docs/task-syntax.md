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

### Markers {#markers}

| Line | Meaning |
| --- | --- |
| `- [ ] text` | open |
| `- [x] text` | done |
| `- [/] text` | in progress |
| `- [>] text` | next |
| `- [<] text` | someday |
| `- [-] text` | cancelled |

Any other marker, such as `[!]`, isn't a Klaar task and is left alone. The `[/]`, `[>]` and `[<]` markers can each be turned off in settings; a someday task leaves the scheduled sections, the calendar and the open-task filters until you bring it back.

### Completed date {#done-stamp}

When you tick a task, Klaar adds ` (@done [[2026-10-23]])` to the line. Turn this off with **Add completed date**, and choose under Settings → Dates whether the stamp shows small and muted, as a chip, or hidden. The note text is the same either way.

### Tags and priority {#tags}

Tags listed in settings become coloured pills in the editor, in reading mode and in Klaar's own views. Each tag has a role:

| Tag | Colour | Role |
| --- | --- | --- |
| `#p1` | red | high priority |
| `#p2` | orange | medium priority |
| `#p3` | yellow | low priority |
| `#bugs` | purple | label |

Add your own, change colours, or give a tag the in progress role so it marks a task in progress instead of `[/]`.

### Commands {#commands}

| Command | What it does |
| --- | --- |
| Move task to… | Schedule or reschedule the task under the cursor. |
| Toggle in progress | Switch between open and in progress. |
| Toggle next | Switch between open and `[>]`. |
| Toggle someday | Switch between open and `[<]`. |
| Cycle priority | Step through your priority tags. |
| Open calendar | Show the calendar in the sidebar. |
