---
title: Getting Started
slug: getting-started
order: 1
headings:
  - id: install
    label: Install
  - id: verify
    label: Verify a release
  - id: first-steps
    label: First steps
  - id: privacy
    label: Privacy
---

Klaar keeps your tasks as plain Markdown checkboxes in your own notes. Schedule a task by linking it to a day, week, month, quarter or year, and it shows up in that period's journal note. Nothing is stored anywhere else.

<video src="{{ '/assets/klaar-tour.mp4' | relative_url }}" poster="{{ '/assets/klaar-tour.jpg' | relative_url }}" controls preload="none" class="doc-section__media"></video>

### Install {#install}

Requires Obsidian 1.13.0 or newer. Klaar is in Obsidian's community plugin directory: open Settings → Community plugins → Browse, search for **Klaar**, then install and enable it. Or use the button below to open its page.

<div class="actions not-prose">
  <a class="button button--primary" href="https://obsidian.md/plugins?id=klaar">Install in Obsidian{% include arrow-icon.html %}</a>
</div>

Other ways to install:

- **BRAT:** add `i-am-fran/obsidian-klaar` in the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin to follow every release as soon as it's published.
- **Manual:** copy `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/i-am-fran/obsidian-klaar/releases) into `<vault>/.obsidian/plugins/klaar/`, then enable Klaar in Settings → Community plugins.

### Verify a release {#verify}

Release files come with GitHub build provenance attestations. To check that `main.js` was built from this repository:

```bash
gh attestation verify main.js --repo i-am-fran/obsidian-klaar
```

### First steps {#first-steps}

1. Klaar keeps journal notes in a folder called `Daily`. Change it under Settings → Klaar → Journal notes folder if yours live elsewhere.
2. Open the calendar with the **Open calendar** command and click today to open (or create) today's note.
3. In any note, write a task such as `- [ ] Call the bank`, type `>` at the end of the line and pick **Tomorrow**.
4. Open tomorrow's note from the calendar: the task is listed at the top.

<aside class="callout callout--tip not-prose" markdown="1">
**Tip:** Klaar only reads and rewrites task lines. Uninstall it and your notes are still plain Markdown with ordinary `[[links]]`.
</aside>

### Privacy {#privacy}

Klaar reads the Markdown files in your vault, on your device, to find tasks. It makes no network requests. Found a bug? Please [report it](https://github.com/i-am-fran/obsidian-klaar/issues).
