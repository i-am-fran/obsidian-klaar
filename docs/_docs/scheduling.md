---
title: Scheduling
slug: scheduling
order: 2
headings:
  - id: date-picker
    label: The > picker
  - id: move-task
    label: Schedule task…
  - id: send-task
    label: Sending tasks on
  - id: review-overdue
    label: Review overdue
  - id: schedule-keys
    label: Schedule keys
  - id: date-chips
    label: Date chips
  - id: unscheduled
    label: What still needs a date
---

A scheduled task is an ordinary task line with a link to a period at the end. Klaar writes the link for you, but you can type it by hand too. Plan on whatever horizon fits: most things belong to a week, bigger things to a month or a year, and only a few to a specific day.

### The > picker {#date-picker}

On a task line, type `>` and pick when it's due:

- Today, Tomorrow and the next seven days by name
- This week, Next week
- This month, Next month
- This quarter, This year

Keep typing to filter the list, for example `>fri` or `>next`. Typing a full key such as `2026-W45` offers that exact period. Klaar replaces the `>` with a link like `>[[2026-10-23]]` or `>[[2026-W43]]`.

![Typing > after a task opens the date picker: Today, Tomorrow and the next seven days with their dates]({{ '/assets/schedule-picker.webp' | relative_url }}){: .doc-section__media}

### Schedule task… {#move-task}

**Schedule task…** opens the same list from the command palette or the editor's right-click menu, and replaces the task's existing link. To reschedule from elsewhere:

- Use the ⋯ menu on a task in a journal note, a Klaar Table or a Klaar Board (see [Sending tasks on](#send-task)).
- Drag a task onto a day in the [calendar](#calendar).
- Drag a card to Today or This week on a [board by date](#board).

To put a task in a different note instead, use **Move task to note…** from the command palette or the right-click menu. Pick a note and Klaar moves the task, with its subtasks, to the end of it. To put it at the top instead (below any frontmatter), change **New and moved tasks go at** in Settings → Klaar; the same setting applies to **Send task to…**, Review overdue and the New task button in the Klaar Table and Board. Its schedule link stays as it is.

### Sending tasks on {#send-task}

The ⋯ menu on a task offers Today, Tomorrow, This week, Next week, This month, Next month and Pick a date…, plus Move to note…, Someday and Cancel task. **Send task to…** does the same from the command palette or the right-click menu, for the task under the cursor or every task in a selection.

What happens depends on where the task lives:

- **In a journal note**, the task moves into the target note, with its subtasks, and loses its old `>` link: the note it's in is now its date. If that note doesn't exist yet, Klaar creates it.
- **In any other note**, such as a project note, the task stays where it is and gets a `>` link to the new period, so the project keeps its tasks.

A notice says where the task went and has an Undo button. From the editor, ordinary undo brings the tasks back.

**Move open tasks to…** (command palette and the note's ⋯ menu, in journal notes) moves every unfinished task in the note, with its subtasks, in one go. Use it to carry last week forward. Holding Alt (Option on a Mac) while dragging a task onto a calendar day also moves it into that day's note, where a plain drag only reschedules it.

### Review overdue {#review-overdue}

**Review overdue tasks** goes through your overdue tasks one at a time, oldest first, and sends each one on with a single key:

| Key | Does |
| --- | --- |
| T | Today |
| M | Tomorrow |
| W | This week |
| N | Next week |
| O | This month |
| X | Next month |
| D | Pick a date… |
| S | Someday |
| C | Cancel task |
| Enter | Skip |
| Backspace | Undo the last one |

Tasks move or get a new link by the same rule as the ⋯ menu. Run it from the command palette or the **Review** link at the right of the Overdue heading in today's note.

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

![Scheduled tasks shown as date chips: Sat 24 Oct, Week 43, Week 44, Nov 2026, Tomorrow]({{ '/assets/schedule-chips.png' | relative_url }}){: .doc-section__media}

### What still needs a date {#unscheduled}

Tasks without a link (and not in a journal note) are undated. To find them, make a [Klaar Board](#board) with **Columns** set to **Date**: they sit in the Undated column. Drag a card to Today or This week to schedule it, or to Later to pick a date. In a [Klaar Table](#table), set the **When** filter to **Undated**.
