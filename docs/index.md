---
layout: home
sections:
  - id: how-it-works
    label: How it works
  - id: features
    label: Features
  - id: explore
    label: Explore
---
<p class="lede">{{ site.tagline }}</p>

<div class="actions">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian{% include arrow-icon.html %}</a>
  <a class="button" href="{{ site.github_url }}">View on GitHub</a>
</div>

<video src="{{ '/assets/klaar-intro.mp4' | relative_url }}" poster="{{ '/assets/klaar-intro.jpg' | relative_url }}" controls playsinline preload="none" class="showcase" aria-label="The two-minute Klaar intro: writing and scheduling tasks, the calendar, today's note, reviewing overdue tasks, the Bases table and board, and the commands"></video>

## How it works {#how-it-works}

There are four ways to use Klaar, and each builds on the one before. Start with the first and add the others when you want them.

### 1. Tasks anywhere

Write a task in any note: a meeting note, a project note, today's note. Type `>` at the end of the line and pick a day, a week, a month or a year. Klaar adds a link to that period's note, which reads as a small date chip:

```markdown
- [ ] Send the quarterly report #p1 >[[2026-W43]]
```

![A project note with tasks in progress, next, open, done and cancelled, each with a priority pill and a date chip: Thu 29 Oct in red, Today, Week 44, Week 45, Nov 2026]({{ '/assets/project-note.webp' | relative_url }}){: .showcase}

[More about tasks anywhere]({{ '/docs.html#tasks-anywhere' | relative_url }}).

### 2. With journal notes

Open your week note and the task is there, along with what you planned for the month around it and for each day inside it. Today's note shows what's due today, what's still open this week and anything overdue. Tick a task there and it's ticked in the note where you wrote it. A calendar in the sidebar takes you between notes.

![Today's note with Klaar: three tasks scheduled for today, grouped by note and heading, closed Scheduled this week and Overdue sections above the note's own schedule, and the calendar in the sidebar]({{ '/assets/day-note.webp' | relative_url }}){: .showcase}

[More about journal notes]({{ '/docs.html#journal-notes' | relative_url }}).

### 3. With Bases

Klaar Table and Klaar Board show the tasks of any base. Search, filter and group them, and drag a card to Done, In progress, a priority or a date: Klaar changes just that line. A board by date puts every task without a date in its own column.

![A Klaar Board by status, searched for ridely: To do, Next, In progress, Someday and Done columns, each card with its priority, date chip and note]({{ '/assets/board.webp' | relative_url }}){: .showcase}

[More about the Bases views]({{ '/docs.html#bases-views' | relative_url }}).

### 4. Catching up

Send any task on from its ⋯ menu: a task in a journal note moves into the new day's or week's note, a task in a project note gets a new link. Back after a break, **Review overdue tasks** goes through what's overdue one task at a time, with a single key for each.

![The Review overdue window on task 5 of 11, Button component with all states, overdue since Wed 28 Oct, with keys to send it to Today, Tomorrow, This week, Next week, This month or Next month, or to complete, park, cancel or skip it]({{ '/assets/review.webp' | relative_url }}){: .showcase}

[More about catching up]({{ '/docs.html#catching-up' | relative_url }}).

***

## Features {#features}

**Plan on different horizons.** Most things belong to a week, bigger ones to a month or a year. Each note shows the periods around and inside it, so nothing gets lost between notes.

**Part of Obsidian.** Plain checkboxes, ordinary tags like `#p1`, a calendar in the sidebar, and tables and boards in Bases instead of a query language.

**Minimal on purpose.** Klaar doesn't write anything into your journal notes, and your tasks stay plain Markdown. If you stop using Klaar tomorrow, nothing breaks. It only reads the Markdown files in your vault, on your device, and never connects to the internet. No recurring tasks, times or stats either: the [FAQ]({{ '/docs.html#faq' | relative_url }}) says why.

[Every feature, including the little ones]({{ '/docs.html#all-features' | relative_url }}).

***

<div class="section-head">
  <h2 id="explore">Explore</h2>
  <a class="pill" href="{{ '/docs.html' | relative_url }}">All docs</a>
</div>

<ul class="arrow-list">
  <li><a class="arrow-card" href="{{ '/docs.html#tasks-anywhere' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Tasks anywhere</span><span class="arrow-card__desc">Write tasks in any note and give them a date with &gt;.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#journal-notes' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Journal notes</span><span class="arrow-card__desc">What each day, week, month and year note shows, and the calendar.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#bases-views' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Bases views</span><span class="arrow-card__desc">Klaar Table and Klaar Board for any base.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#catching-up' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Catching up</span><span class="arrow-card__desc">Send tasks on and review what's overdue, one key each.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#settings' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Settings</span><span class="arrow-card__desc">Folder, period types, markers, tags and Style Settings.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#all-features' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">All features</span><span class="arrow-card__desc">Every feature, including the little ones.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#roadmap' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Roadmap</span><span class="arrow-card__desc">What's planned next.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ site.github_url }}" target="_blank" rel="noopener noreferrer"><span class="arrow-card__text"><span class="arrow-card__title">GitHub</span><span class="arrow-card__desc">Source, releases and issues.</span></span>{% include arrow-icon.html %}</a></li>
</ul>
