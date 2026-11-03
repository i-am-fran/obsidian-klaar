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
  - id: templates
    label: Templates
  - id: plan-a-week
    label: Planning a week
---

Journal notes are your day, week, month, quarter and year notes. When you open one, Klaar shows the tasks due in it above the note's own text. Tasks cascade: a week note shows the month around it and the days inside it, so the bigger plans are there every time you plan.

![A day note with Klaar: three tasks scheduled for the day, grouped by note and heading, a closed Scheduled this week section above the note's own text, and the calendar in the sidebar]({{ '/assets/day-note.webp' | relative_url }}){: .doc-section__media}

### Note names {#note-names}

Each note is named after its schedule key and lives in the journal notes folder (`Daily` by default):

- `Daily/2026-10-23.md`
- `Daily/2026-W43.md`
- `Daily/2026-10.md`
- `Daily/2026-Q4.md`
- `Daily/2026.md`

When you open a note that doesn't exist yet, Klaar asks before creating it. It starts empty, or from your [template](#templates) for that kind of note.

### What a note shows {#what-shows}

- **Scheduled for today** (or this day, this week, this month…): tasks linked to this note's period.
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

- Tick a task and its line in its own note is updated, with the done date if that's on.
- Click a task's text to open its note at that line. The line flashes so you can find it.
- Click a note's name to open the note. The arrow next to it folds the group.
- Cmd-click (Ctrl-click on Windows and Linux) opens a new tab.

### Period types {#period-types}

Daily, weekly, monthly and yearly notes are on by default; quarterly is off. Turn any of them on or off under Settings → Klaar → Period types. A period type that's off disappears from the scheduled sections, the calendar and the date picker. With weekly off, a day note shows "Scheduled this month" instead.

### Templates {#templates}

Each period type can have its own template: any note in your vault, picked under Settings → Klaar → Templates. Whenever Klaar creates a note of that kind (from the calendar, when you send a task to a new week, or when you add a task from a base), the note starts with the template's text. Notes that already exist are never changed.

Klaar fills in the same placeholders as Obsidian's core Templates plugin:

| You write | It becomes |
| --- | --- |
| `{% raw %}{{title}}{% endraw %}` | the note's name, like `2026-W45` |
| `{% raw %}{{date}}{% endraw %}` | the first day of the period, like `2026-11-02` for week 45 |
| `{% raw %}{{date:dddd D MMMM}}{% endraw %}` | that day in your own [format](https://momentjs.com/docs/#/displaying/format/): `Monday 2 November` |
| `{% raw %}{{time}}{% endraw %}` | the time the note was created, or `{% raw %}{{time:FORMAT}}{% endraw %}` |

Anything else, like Templater's `<% %>` code, stays as written. If Templater's "Trigger on new file creation" is on, Templater fills it in.

If the template file has been moved or deleted, Klaar creates the note empty and tells you.

### Planning a week {#plan-a-week}

This is how I use it. On Monday I open the week note and decide what the week is really about. During the week, tasks come up everywhere: in meeting notes, in project notes, in a random idea. I write them down right there and send them to the week with `>`.

As the days go by, I pull tasks from the week into specific days. The bigger, vaguer things sit in the month or year note, and because they show up in the week note too, I see them every time I plan.

Each morning, today's note shows what's due today, what's still open this week and anything overdue. When I want to know what still needs a date, I open a [Klaar Board](#board) by date and drag cards from Undated to Today or This week.
