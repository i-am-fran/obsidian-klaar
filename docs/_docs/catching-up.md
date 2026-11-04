---
title: Catching up
slug: catching-up
order: 5
headings:
  - id: send-task
    label: Sending tasks on
  - id: review-overdue
    label: Review overdue
---

Plans change. Klaar's job is to make moving a task cheap, so an old list never turns into a pile of guilt.

![Today's note with the Overdue section open and a task's ⋯ menu showing Today, Tomorrow, This week, Next week, This month, Next month, Pick a date…, Move to note…, Someday and Cancel task]({{ '/assets/task-menu.webp' | relative_url }}){: .doc-section__media}

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
| Space | Complete |
| S | Someday |
| C | Cancel task |
| Enter | Skip |
| Backspace | Undo the last one |

Tasks move or get a new link by the same rule as the ⋯ menu. Run it from the command palette or the **Review** link at the right of the Overdue heading in today's note.

![The Review overdue window on task 5 of 11, Button component with all states, overdue since Wed 28 Oct, with keys to send it to Today, Tomorrow, This week, Next week, This month or Next month, or to complete, park, cancel or skip it]({{ '/assets/review.webp' | relative_url }}){: .doc-section__media}
