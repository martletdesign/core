# Direct HTML anatomy

> Candidate imports below refer to an unpublished local `@martlet/core` tarball; published `@martlet/theme` remains available.

Core 2.2.2 · Framework-independent classes. Import `@martlet/core/full.css` and optional `fonts.css`, then use `class="martlet" data-martlet="light"` on your shell. A class beginning `martlet-` is namespaced; a primitive name in `layout.json` is not itself an HTML class. These contracts work in server HTML, Astro and React JSX (`className`) without reconstructing another framework's implementation.

| Object | Classes / native structure |
| --- | --- |
| Container | `martlet-container`; add `--reading` or `--archive` modifier for that measure. |
| Stack / cluster | `martlet-stack`, `martlet-cluster`; `--end` / `--between` on cluster. |
| Grid | `martlet-grid`; `--1`, `--2`, `--4` bound maximum columns; default maximum is 3. |
| Local spacing | `martlet-space-small` or `martlet-space-large` on the primitive whose own gap changes. |
| Sidebar | `martlet-sidebar` containing `martlet-sidebar__main` and `martlet-sidebar__aside`. Put an actual `aside` with an accessible name on support. Use DOM order appropriate to task; CSS does not reorder. |
| Split | `martlet-split`; `--wide-start` / `--wide-end` / `--start` modifiers. |
| Page header | `header.martlet-page-header > .martlet-container > .martlet-page-header__copy` with one h1; optional `martlet-eyebrow`, `martlet-page-header__summary`, `martlet-page-header__metadata`. |
| Reading | `martlet-reading-context > .martlet-reading-layout` containing `martlet-reading-layout__contents` then `martlet-reading-layout__body`; prose in `article.martlet-prose`. |
| Contents | `nav.martlet-contents.martlet-contents--index` (or `--inline`) with an accessible name, `martlet-contents__label`, unnumbered parent list and nested child list. Real fragment links target meaningful heading IDs. |
| Header | `header.martlet-site-header > .martlet-container`, host brand, named native `nav`, host links. Wrapping only; no dropdown controller. |
| Footer | `footer.martlet-site-footer`; add `martlet-site-footer--grouped`, inner container, `martlet-site-footer__top` containing optional `__identity` and `__groups`; each `__group` has heading and named nav. Separate `__base` follows `__top`. The host supplies identity and destinations. |
| Forms and state | See [native form styling](form-styling.md) for exact supported classes, semantics and host obligations. |

Modifiers always retain their base class, for example `class="martlet-grid martlet-grid--2"`. A source profile uses `class="martlet martlet-source-profile"` with its separate stylesheet imported last. Reading contents remain in source before the body; support remains separate from navigation. Set `tabindex="-1"` on fragment targets if activation should move keyboard focus.

The generic header is not the origin's scrolling/floating masthead. Appearance inversion and scroll state on a documentation host do not automatically apply to adopting applications. Native HTML and host identity remain authoritative. Semantic markup and a task-appropriate page hierarchy are required, even when no framework wrapper is used.
