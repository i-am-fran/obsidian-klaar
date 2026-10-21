# Changelog

## 2026.10.16

- With reduced motion on, date chips no longer fade on hover, like the rest of Klaar.
- Coloured tags in the editor are drawn as one piece by the theme.
- Release files come with GitHub build provenance attestations, so you can check they were built from this repository.
- Klaar is out of beta.

## 2026.10.15

- Period notes are now called journal notes: the setting is "Journal notes folder" and the calendar asks "Create journal note?". Nothing changes in your vault or settings.

## 2026.10.14

First public release (beta). Requires Obsidian 1.13.0 or newer.

- Schedule a task by typing `>` on its line and picking a day, week, month, quarter or year. "Move task to…" does the same from the command palette or the editor menu.
- Day, week, month, quarter and year notes list the tasks scheduled for them, the ones from the period above, the periods inside them, and Overdue on today's note. Nothing is written into the note.
- A calendar in the sidebar with ISO week numbers and task markers. Click a day or week to open its note; drag a task onto a day to reschedule it.
- `- [/]` in progress, `- [>]` next, `- [<]` someday and `- [-]` cancelled markers, each with a command to toggle it, and a "Cycle priority" command.
- Coloured tag pills with priority and in-progress roles (`#p1`, `#p2`, `#p3`, `#bugs` by default) and date chips such as `Today` or `Week 43`, red when overdue.
- "Klaar Table" and "Klaar Board" views for Bases: search, filter, sort and group tasks, and drag a card between columns to rewrite just that task's line.
