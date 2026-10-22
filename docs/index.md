---
layout: home
sections:
  - id: how-it-works
    label: How it works
  - id: install
    label: Install
  - id: explore
    label: Explore
---
<p class="lede">Tasks and journal notes for Obsidian. Your tasks stay plain Markdown checkboxes in your own notes: type <code>&gt;</code> to schedule one, and it shows up in that day's, week's, month's or year's note.</p>

<div class="actions">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian</a>
  <a class="button" href="{{ site.github_url }}">View on GitHub</a>
</div>

<a href="{{ '/assets/klaar-tour.mp4' | relative_url }}"><img src="{{ '/assets/klaar-tour.jpg' | relative_url }}" alt="A short tour of Klaar: click to watch the video" class="showcase"></a>

## How it works {#how-it-works}

Write a task anywhere in your vault, then type `>` on its line and pick a day, week, month or year. Klaar writes a link to that period's note:

```markdown
- [ ] Send the quarterly report #p1 >[[2026-W43]]
```

Open your week note and the task is listed there, with the ones scheduled for the days inside it and, on today's note, anything overdue. Tick it there and the line in its own note is updated. Klaar never writes generated content into your notes.

***

## Install {#install}

Klaar is in Obsidian's community plugin directory. In Obsidian, open Settings → Community plugins → Browse, search for **Klaar**, then install and enable it. Requires Obsidian 1.13.0 or newer. Other ways to install are in [Getting Started]({{ '/docs.html#getting-started' | relative_url }}).

<div class="actions">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian</a>
</div>

Klaar reads the Markdown files in your vault, on your device. It makes no network requests.

***

<div class="section-head">
  <h2 id="explore">Explore</h2>
  <a class="pill" href="{{ '/docs.html' | relative_url }}">All docs</a>
</div>

<ul class="arrow-list">
  <li><a class="arrow-card" href="{{ '/docs.html#scheduling' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Scheduling</span><span class="arrow-card__desc">Type &gt; on a task and pick a day, week, month, quarter or year.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#journal-notes' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Journal notes</span><span class="arrow-card__desc">What each day, week, month and year note shows.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#calendar' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Calendar</span><span class="arrow-card__desc">A sidebar month view: open notes, drag tasks onto days.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#task-syntax' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Task syntax</span><span class="arrow-card__desc">Markers, schedule keys, tags and priority.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ '/docs.html#bases-views' | relative_url }}"><span class="arrow-card__text"><span class="arrow-card__title">Bases views</span><span class="arrow-card__desc">Klaar Table and Klaar Board for any base.</span></span>{% include arrow-icon.html %}</a></li>
  <li><a class="arrow-card" href="{{ site.github_url }}" target="_blank" rel="noopener noreferrer"><span class="arrow-card__text"><span class="arrow-card__title">GitHub</span><span class="arrow-card__desc">Source, releases and issues.</span></span>{% include arrow-icon.html %}</a></li>
</ul>
