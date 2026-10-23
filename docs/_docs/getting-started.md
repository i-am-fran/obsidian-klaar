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

Klaar is a small task manager that lives in your Obsidian journal notes. Tasks stay plain Markdown checkboxes in your own notes. Link one to a day, week, month, quarter or year, and it shows up in that period's journal note. Nothing is stored anywhere else.

<video src="{{ '/assets/klaar-tour.mp4' | relative_url }}" poster="{{ '/assets/klaar-tour.jpg' | relative_url }}" autoplay muted loop playsinline controls class="doc-section__media"></video>

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
