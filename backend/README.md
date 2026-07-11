# Writerly backend

The app uses Bun's built-in SQLite driver, so no separate database service is
required. Starting the API creates and seeds `data/writerly.sqlite` automatically.

```bash
bun run index.ts
```

Use `GET /api/manuscripts/manuscript_leave` to load the editor and
`PATCH /api/chapters/:id` to autosave its TipTap JSON and HTML content.
The full relational schema is in `schema.sql`.
