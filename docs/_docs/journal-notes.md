---
title: Journal notes
slug: journal-notes
order: 3
headings:
  - id: note-names
    label: Note names
  - id: what-shows
    label: What a note shows
  - id: working-in-a-note
    label: Working from a note
  - id: period-types
    label: Period types
---

Journal notes are your day, week, month, quarter and year notes. When you open one, Klaar shows the tasks due in it above the note's own text. Tasks cascade: a week note shows the month around it and the days inside it, so the bigger plans are there every time you plan.

![Today's note with Klaar: tasks scheduled for today, this week and overdue, grouped by project, and the calendar in the sidebar]({{ '/assets/today-note.png' | relative_url }}){: .doc-section__media}

### Note names {#note-names}

Each note is named after its schedule key and lives in the journal notes folder (`Daily` by default):

- `Daily/2026-10-23.md`
- `Daily/2026-W43.md`
- `Daily/2026-10.md`
- `Daily/2026-Q4.md`
- `Daily/2026.md`

When you open a note that doesn't exist yet, Klaar asks before creating it, as an empty file. If another note elsewhere in the vault has the same name, Klaar tells you once and keeps using the one in the journal notes folder.

### What a note shows {#what-shows}

- **Scheduled for today** (or this week, this month…): tasks linked to this note's period.
- **Scheduled this week** (or this month, this year…): open tasks from the period around it, so today's note shows what's still due this week.
- The periods inside it: a week note lists each of its days, a month note each of its weeks. These start closed.
- **Overdue**: open tasks whose period has passed, on today's note only.

Within each section, tasks are grouped by the note they live in, then by heading. The count next to a section is its open tasks. In a day note, tasks you've ticked move into a **Done** group at the bottom of the day's list, closed to start, so you can look back on the day without it getting in the way.

Fold any section or group. Klaar remembers which sections you keep open, per kind of note, so all your day notes look the same.

<aside class="callout callout--legenda not-prose" markdown="1">
Klaar never writes generated content into a note. It only changes a task line you acted on: ticking it, scheduling it, or changing its marker or priority.
</aside>

<!-- Screenshot: a week note with "Scheduled for this week", "Scheduled this month" and two day groups, one opened. Save as docs/assets/week-note.png -->

### Working from a note {#working-in-a-note}

- Tick a task and its line in its own note is updated, with the completed date if that's on.
- Click a task's text to open its note at that line. The line flashes so you can find it.
- Click a note's name to open the note. The arrow next to it folds the group.
- Cmd-click (Ctrl-click on Windows and Linux) opens a new tab.
- The calendar button on each task opens **Move task to…**.
- Drag a task onto a calendar day to move it.

### Period types {#period-types}

Daily, weekly, monthly and yearly notes are on by default; quarterly is off. Turn any of them on or off under Settings → Klaar → Period types. A period type that's off disappears from the scheduled sections, the calendar and the date picker. With weekly off, a day note shows "Scheduled this month" instead.
