# Writerly

Writerly is a calm, browser-based writing workspace for organizing manuscripts and chapters. It includes a rich-text editor, automatic saving, chapter goals, and PDF export.

## Features

- Create, rename, and delete manuscripts and chapters
- Write with headings, bold, italics, underlines, lists, and quotes
- Text alignment (left, center, right, justify) preserved in both editor and PDF export
- Autosave chapter content and word counts
- Set a chapter goal and track progress
- Export a chapter as a PDF
- Local Bun + SQLite API; no separate database service is needed

## Tech stack

- Frontend: React, TypeScript, Vite, TipTap, and Tailwind CSS
- Backend: Bun, Elysia, and SQLite

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) 1.0 or later

### Install dependencies

```bash
bun install
cd backend
bun install
cd ..
```

### Run locally

Start the API in one terminal:

```bash
cd backend
bun run index.ts
```

Start the frontend in another terminal:

```bash
bun run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The frontend forwards `/api` requests to the backend at `http://localhost:3001`.

The backend creates and seeds `backend/data/writerly.sqlite` automatically on first run.

## Available commands

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `bun run dev`     | Start the frontend development server    |
| `bun run build`   | Type-check and create a production build |
| `bun run lint`    | Run Oxlint                               |
| `bun run preview` | Preview the production build             |

## Project structure

```text
src/                 React app and styling
src/components/      Editor, dialogs, and interface components
src/lib/             Client-side helpers, including PDF export
backend/             Bun/Elysia API and SQLite database
backend/schema.sql   Database schema
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, coding, and pull-request guidance.

## Changelog

### v0.0.1 — PDF text alignment fix

**Problem:** Text alignment (center, right, justify) set in the editor was not reflected in exported PDFs. Headings appeared left-aligned regardless of the alignment chosen.

**Root cause:** Two issues in `src/lib/exportChapterPdf.ts`:

1. The heading styling loop used `el.style.cssText = ...`, which replaced the entire `style` attribute and wiped out the `text-align` inline style written by Tiptap.
2. Tiptap wraps heading text in `<span>` elements. Because html2canvas has limited CSS inheritance support, `text-align` on the parent `<h*>` was not applied to the inner `<span>`, causing alignment to be lost during canvas rendering.

**Fix:**

- Replaced `el.style.cssText = ...` with individual property assignments to preserve existing inline styles.
- Added a loop that explicitly copies `text-align` from each block element to its child `<span>` elements before rendering.
- Added a `<style>` tag inside the printable element to reinforce inheritance rules for html2canvas.

**File changed:** `src/lib/exportChapterPdf.ts`

### v0.0.0 — Initial release

- Create, rename, and delete manuscripts and chapters
- Rich-text editor with headings, bold, italics, underline, lists, and quotes
- Autosave with word count tracking
- Chapter goals and progress bar
- PDF export via jsPDF + html2canvas
- Local Bun + SQLite backend, no external database required

---

## License

This project is licensed under the [MIT License](LICENSE).
