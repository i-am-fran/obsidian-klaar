# Changelog

## 2026.10.18

- Tags in settings now have a type: Tag, Priority or Status. A status tag like `#waiting` gets its own column on the status board, after In progress. Drop a card there to add the tag; drop it anywhere else to remove it. Your existing tags keep their meaning, and in progress tags are now a kind of status.
- If a task has more than one status tag, the one listed first in settings wins.
- On mobile, the toolbar in the Tasks and Board views now stays on one line: the New task button shows just its icon and the Today button is hidden.

## 2026.10.17

- In your journal notes, the arrow next to a note's name now opens and closes its tasks. Click the note's name to open the note itself (Cmd/Ctrl-click opens it in a new tab).
- Click a task's text to jump to that task in its note.
- The "Move to day" button now sits at the right end of each task and lines up with the first line of text, whatever your theme.

## 2026.10.16

- If you have reduced motion turned on, date chips no longer fade when you hover over them. The rest of Klaar already worked this way.
- Coloured tags in the editor now look like one single pill, drawn by your theme.
- Each release now comes with a GitHub build attestation, so you can check the files were built from this repository.
- Klaar is out of beta.

## 2026.10.15

- I've renamed period notes to journal notes. The setting is now called "Journal notes folder" and the calendar asks "Create journal note?". Nothing changes in your vault or your settings.

## 2026.10.14

The first public release, still in beta. You need Obsidian 1.13.0 or newer.

- Type `>` on a task line to schedule it for a day, week, month, quarter or year. "Move task to…" does the same from the command palette or the editor menu.
- Your day, week, month, quarter and year notes show the tasks planned for them, the ones from the period around them and the periods inside them. Today's note also shows anything overdue. Klaar doesn't write any of this into your notes.
- A calendar in the sidebar, with week numbers and a marker on days that have tasks. Click a day or week to open its note, or drag a task onto a day to move it.
- Extra markers for in progress `- [/]`, next `- [>]`, someday `- [<]` and cancelled `- [-]`, each with its own command, plus a "Cycle priority" command.
- Coloured tags, with `#p1`, `#p2`, `#p3` and `#bugs` set up to start with, and date chips like `Today` or `Week 43` that turn red when a task is overdue.
- Two views for Bases, Klaar Table and Klaar Board. Search, filter, sort and group your tasks, and drag a card to another column to change just that task.
