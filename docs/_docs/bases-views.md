---
title: Bases views
slug: bases-views
order: 6
headings:
  - id: add-view
    label: Adding a view
  - id: toolbar
    label: Search and buttons
  - id: table
    label: Klaar Table
  - id: board
    label: Klaar Board
  - id: tag-columns
    label: Tag columns
---

Klaar adds two views to Obsidian Bases. They show the tasks inside the notes a base matches, so a base filtered to a project folder or a tag gives you that project's tasks. Klaar uses Bases' own filters rather than a query language of its own.

### Adding a view {#add-view}

Open or create a base, click the view menu and add a view of type **Klaar Table** or **Klaar Board**. Everything Klaar adds is under **Configure view**, and each view remembers its own choices.

### Search and buttons {#toolbar}

Both views have a bar at the top:

- A search box that filters by task text, tags and note names.
- A task count, which reads "12 of 40" while search or filters hide some.
- **New task**: adds `- [ ] your text` to today's note, creating the note if needed.
- **Today**: opens today's note. The arrow next to it opens this week's, this month's, this quarter's or this year's note. Cmd/Ctrl-click opens a new tab.

On mobile the buttons show their icons only.

Turn off **Show search** to hide the bar.

### Klaar Table {#table}

A table with the Task, Date and Note columns. Under **Configure view**:

- **Columns**: add Status, Priority, Tags or Heading. A Priority or Tags column takes those pills out of the task text.
- **Filters**: Status, When, Marker and **Show subtasks**.
- **Sort and group**: sort by Date, Priority, Note or Task, **Reverse sort**, and group by date, note, priority or not at all.

The default sort is by date, with priority tasks first within each date. Tick a task, click its text to open it at its line, use the calendar button to reschedule it, or drag the row onto the calendar.

![A Klaar Table grouped by date, with the search bar, the task count, and Task, Date and Note columns]({{ '/assets/table.webp' | relative_url }}){: .doc-section__media}

### Klaar Board {#board}

Columns of cards. Choose what the columns are under **Configure view** → **Columns**:

| Columns | The board shows |
| --- | --- |
| Status | To do, Next, In progress, any tag columns, Someday, Done |
| Priority | High, Medium, Low, No priority |
| Date | Overdue, Today, This week, Later, Undated |

Drag a card to another column and Klaar rewrites just that task's line:

- **Done** ticks it, with the completed date if that's on. **To do**, **Next**, **In progress** and **Someday** set its marker.
- A priority column swaps its priority tag.
- **Today** and **This week** set its link, **Undated** removes it, and **Later** opens the date picker. Overdue doesn't take drops.

Cancelled tasks don't show on the board. Also under **Configure view**: **Show done** (status board only), **Column width**, and the same filters and sort as the table.

![A Klaar Board by status with To do, Next, In progress, Someday and Done columns, each card showing its date chip and note]({{ '/assets/board.webp' | relative_url }}){: .doc-section__media}

### Tag columns {#tag-columns}

On a board by status, **Configure view** → **Tag columns** lists your tags from Settings → Tags that have the Label role, such as `#waiting` or `#blocked`, each with a switch. Each tag you turn on gets its own column after In progress, in the order of your settings, so one board can have a Waiting column while another doesn't. Drop a card on a tag column to add the tag; drop it on any other status column to remove it. If a task has more than one of the tags, the one listed first in settings wins.
