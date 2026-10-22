---
title: Journal notes
slug: journal-notes
order: 3
headings:
  - id: note-names
    label: Note names
  - id: what-shows
    label: What a note shows
  - id: period-types
    label: Period types
---

Journal notes are your day, week, month, quarter and year notes. Klaar shows the tasks due in each one above the note's own text, without writing anything into the file.

![Today's note with Klaar: tasks scheduled for today, this week and overdue, grouped by project, and the calendar in the sidebar]({{ '/assets/today-note.png' | relative_url }}){: .doc-section__media}

### Note names {#note-names}

Each note is named after its schedule key and lives in the journal notes folder (`Daily` by default): `Daily/2026-10-23.md`, `Daily/2026-W43.md`, `Daily/2026-10.md`, `Daily/2026-Q4.md`, `Daily/2026.md`. When a note doesn't exist yet, Klaar asks before creating it, as an empty file.

### What a note shows {#what-shows}

- **Scheduled for** this period.
- **Scheduled this week, month, …:** tasks from the period above, so today's note shows what's still due this week.
- The periods inside it: a week note lists its days, a month note its weeks.
- **Overdue**, on today's note only.

Tasks are grouped by the note they live in, then by heading, and each group can be folded. Tick a task here and its line in its own note is updated.

<aside class="callout callout--legenda not-prose" markdown="1">
Klaar never writes generated content into a note. It only changes a task line you acted on: ticking it, scheduling it, or changing its marker or priority.
</aside>

### Period types {#period-types}

Day, week, month and year notes are on by default; quarter notes are off. Turn any of them on or off under Settings → Klaar → Period types. A period type that's off disappears from the scheduled sections, the calendar and the date picker.
