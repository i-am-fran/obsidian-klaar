---
layout: home
sections:
  - id: how-it-works
    label: How it works
  - id: features
    label: Features
  - id: install
    label: Install
  - id: explore
    label: Explore
---
<p class="lede">{{ site.tagline }}</p>

<div class="actions">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian{% include arrow-icon.html %}</a>
  <a class="button" href="{{ site.github_url }}">View on GitHub</a>
</div>

<a href="{{ '/assets/klaar-tour.mp4' | relative_url }}"><img src="{{ '/assets/klaar-tour.jpg' | relative_url }}" alt="A short tour of Klaar: click to watch the video" class="showcase"></a>

## How it works {#how-it-works}

Write a task anywhere in your vault, in a meeting note, a project note or today's note. Type `>` at the end of the line and pick a day, a week, a month or a year. Klaar adds a link to that period's note:

```markdown
- [ ] Send the quarterly report #p1 >[[2026-W43]]
```

Open your week note and the task is there, along with what you planned for the month around it and for each day inside it. Today's note shows what's due today, what's still open this week and anything overdue. Tick a task there and it's ticked in the note where you wrote it.

Klaar is minimal on purpose. It doesn't write anything into your journal notes, and your tasks stay plain Markdown. If you stop using Klaar tomorrow, nothing breaks.

***

## Features {#features}

**Plan on different horizons.** Most things belong to a week, bigger ones to a month or a year. Each note shows the periods around and inside it, so nothing gets lost between notes.

**Change plans in a second.** Type `>` again, drag the task onto a day in the calendar, or drag a card on a board.

**See what still needs a date.** A Klaar Board by date puts every unscheduled task in its own column.

**Part of Obsidian.** Plain checkboxes, ordinary tags like `#p1`, a calendar in the sidebar, and tables and boards in Bases instead of a query language.

[Every feature, including the little ones]({{ '/docs.html#all-features' | relative_url }}).

***

## Install {#install}

Klaar is in Obsidian's community plugin directory. In Obsidian, open Settings → Community plugins → Browse, search for **Klaar**, then install it and turn it on. You need Obsidian 1.13.0 or newer. Other ways to install are in [Getting Started]({{ '/docs.html#getting-started' | relative_url }}).

<div class="actions">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian{% include arrow-icon.html %}</a>
</div>

Klaar only reads the Markdown files in your vault, on your device. It never connects to the internet.

***

<div class="section-head">
  <h2 id="explore">Explore</h2>
  <a class="pill" href="{{ '/docs.html' | relative_url }}">All docs</a>
</div>

<ul class="arrow-list">
  <li><a class="arrow-card" href="{{ '/docs.html#scheduling' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Scheduling</span><span class="arrow-card__desc">Type &gt; on a task and pick a day, week, month, quarter or year.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#journal-notes' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Journal notes</span><span class="arrow-card__desc">What each day, week, month and year note shows.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#calendar' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Calendar</span><span class="arrow-card__desc">A sidebar month view: open notes, drag tasks onto days.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#task-syntax' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Task syntax</span><span class="arrow-card__desc">Markers, the completed date, tags and priority, commands.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#bases-views' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Bases views</span><span class="arrow-card__desc">Klaar Table and Klaar Board for any base.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#settings' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Settings</span><span class="arrow-card__desc">Folder, period types, markers, tags and Style Settings.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#all-features' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">All features</span><span class="arrow-card__desc">Every feature, including the little ones.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ site.github_url }}" target="_blank" rel="noopener noreferrer"><span class="arrow-card__text"><span class="arrow-card__title">GitHub</span><span class="arrow-card__desc">Source, releases and issues.</span></span>{% include arrow-icon.html %}</a></li>
</ul>
