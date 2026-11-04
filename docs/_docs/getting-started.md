---
title: Getting Started
slug: getting-started
order: 1
headings:
  - id: install
    label: Install
  - id: first-steps
    label: First steps
---

Klaar is a small task manager for Obsidian. Tasks stay plain Markdown checkboxes in any of your notes. Link one to a day, week, month, quarter or year, and it shows up in that period's journal note. Nothing is stored anywhere else.

There are four ways to use it, and each builds on the one before:

1. [Tasks anywhere](#tasks-anywhere): write tasks in any note and give them a date with `>`.
2. [With journal notes](#journal-notes): each day, week and month note lists what's planned for it.
3. [With Bases](#bases-views): a table or a board of the tasks in any base.
4. [Catching up](#catching-up): send tasks on, and review what's overdue one key at a time.

<video src="{{ '/assets/klaar-intro.mp4' | relative_url }}" poster="{{ '/assets/klaar-intro.jpg' | relative_url }}" controls playsinline preload="none" class="doc-section__media" aria-label="The two-minute Klaar intro: writing and scheduling tasks, the calendar, today's note, reviewing overdue tasks, the Bases table and board, and the commands"></video>

### Install {#install}

You need Obsidian 1.13.0 or newer. Klaar works on desktop and mobile.

1. In Obsidian, open Settings → Community plugins → Browse.
2. Search for **Klaar**, then install it and turn it on.

<div class="actions not-prose">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian{% include arrow-icon.html %}</a>
</div>

### First steps {#first-steps}

1. Klaar looks for journal notes in a folder called `Daily`. If yours live elsewhere, change **Journal notes folder** in Settings → Klaar.
2. The calendar opens in the right sidebar the first time Klaar runs. Click today to open today's note. If it doesn't exist yet, Klaar asks before creating it.
3. In any note, write a task such as `- [ ] Call the plumber`, type `>` at the end of the line and pick **Tomorrow**.
4. Click tomorrow in the calendar: the task is listed at the top of its note.
