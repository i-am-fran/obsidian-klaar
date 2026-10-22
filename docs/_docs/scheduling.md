---
title: Scheduling
slug: scheduling
order: 2
headings:
  - id: date-picker
    label: The > picker
  - id: move-task
    label: Move task to…
  - id: schedule-keys
    label: Schedule keys
  - id: date-chips
    label: Date chips
---

A scheduled task is an ordinary task line with a link to a period at the end. Klaar writes the link for you, but you can type it by hand too.

### The > picker {#date-picker}

On a task line, type `>` and pick when it's due:

- Today, Tomorrow and the coming weekdays
- This week, Next week
- This month, Next month
- This quarter, This year

Keep typing to filter the list. Typing a full key such as `2026-W45` offers that exact period. Klaar replaces the `>` with a link like `>[[2026-10-23]]` or `>[[2026-W43]]`.

![Typing > on a task line opens the date picker with Today, Tomorrow and the next weekdays]({{ '/assets/schedule-picker.png' | relative_url }}){: .doc-section__media}

### Move task to… {#move-task}

**Move task to…** does the same from the command palette or the editor's right-click menu, and replaces an existing schedule link. You can also drag a task onto a day in the [calendar](#calendar).

### Schedule keys {#schedule-keys}

| Key | Period |
| --- | --- |
| `2026-10-19` | day |
| `2026-W43` | ISO week, starting Monday |
| `2026-10` | month |
| `2026-Q4` | quarter |
| `2026` | year |

A task written in a journal note without a `>` link belongs to that note's period.

### Date chips {#date-chips}

In live preview and reading mode, `>[[2026-10-23]]` reads as `Fri 23 Oct`, `Today` or `Week 43`, and turns red when overdue. The raw date shows on hover. Settings → Dates can show the key as written instead.

![Scheduled tasks shown as date chips: Sat 24 Oct, Week 43, Week 44, Nov 2026, Tomorrow]({{ '/assets/schedule-chips.png' | relative_url }}){: .doc-section__media}
