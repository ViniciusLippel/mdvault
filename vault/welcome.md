# Welcome to mdvault

mdvault is a minimal personal knowledge base that runs entirely in your browser.

## Features

- **Rendered mode** — clean reading view with full markdown support
- **Edit mode** — plain text editor with syntax preserved
- **Nested folders** — organize notes however you like
- **Auto-save** — `Ctrl+S` / `Cmd+S` to save at any time

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save current note |
| `Tab` | Insert 2 spaces |

## Markdown support

You can use the full CommonMark spec:

- **Bold**, *italic*, ~~strikethrough~~
- `inline code` and fenced code blocks
- Blockquotes, tables, horizontal rules
- Links and images

```js
// Example code block
const vault = new MarkdownVault({ path: './vault' });
vault.open('welcome.md');
```

> Start by creating a note with **+ Note** in the sidebar.
