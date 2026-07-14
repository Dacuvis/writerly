import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { existsSync } from "node:fs";
import { join, normalize } from "node:path";
import { db, wordCount } from "./database";

const staticDir = process.env.WRITERLY_STATIC_DIR;

function resolveStaticPath(pathname: string) {
  if (!staticDir) return null;

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const filePath = normalize(join(staticDir, relativePath));

  if (!filePath.startsWith(normalize(staticDir))) return null;
  if (existsSync(filePath)) return filePath;

  const indexPath = join(staticDir, "index.html");
  return existsSync(indexPath) ? indexPath : null;
}

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: "Writerly API",
        version: "1.0.0",
        description: "Personal novel editor API backed by SQLite.",
      },
    },
  }))
  .get("/health", () => ({ ok: true }))
  .get("/api/manuscripts", () => db.query("SELECT id, title, description, cover_color, updated_at FROM manuscripts ORDER BY updated_at DESC").all())
  .post("/api/manuscripts", ({ body, set }) => {
    const id = crypto.randomUUID();
    db.query("INSERT INTO manuscripts (id, owner_id, title, description, cover_color) VALUES (?, 'user_elena', ?, ?, ?)").run(id, body.title, body.description ?? "", body.cover_color ?? "#c9d75e");
    db.query("INSERT INTO manuscript_collaborators (manuscript_id, user_id, role) VALUES (?, 'user_elena', 'owner')").run(id);
    set.status = 201;
    return db.query("SELECT id, title, description, cover_color, updated_at FROM manuscripts WHERE id = ?").get(id);
  }, { body: t.Object({ title: t.String({ minLength: 1, maxLength: 150 }), description: t.Optional(t.String({ maxLength: 500 })), cover_color: t.Optional(t.String({ maxLength: 20 })) }) })
  .get("/api/manuscripts/:id", ({ params, set }) => {
    const manuscript = db.query("SELECT * FROM manuscripts WHERE id = ?").get(params.id);
    if (!manuscript) { set.status = 404; return { error: "Manuscript not found" }; }
    const chapters = db.query("SELECT id, title, position, status, word_goal, font_size, font_family, content_json, content_html, updated_at FROM chapters WHERE manuscript_id = ? ORDER BY position").all(params.id) as Array<Record<string, unknown>>;
    return { ...(manuscript as object), chapters: chapters.map((chapter) => ({ ...chapter, word_count: wordCount(chapter.content_html as string) })) };
  })
  .patch("/api/manuscripts/:id", ({ params, body, set }) => {
    if (!db.query("SELECT id FROM manuscripts WHERE id = ?").get(params.id)) { set.status = 404; return { error: "Manuscript not found" }; }
    db.query("UPDATE manuscripts SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(body.title ?? null, body.description ?? null, params.id);
    return db.query("SELECT id, title, description, cover_color, updated_at FROM manuscripts WHERE id = ?").get(params.id);
  }, { body: t.Object({ title: t.Optional(t.String({ minLength: 1, maxLength: 150 })), description: t.Optional(t.String({ maxLength: 500 })) }) })
  .delete("/api/manuscripts/:id", ({ params, set }) => {
    const result = db.query("DELETE FROM manuscripts WHERE id = ?").run(params.id);
    if (!result.changes) { set.status = 404; return { error: "Manuscript not found" }; }
    return { ok: true };
  })
  .get("/api/chapters", ({ query }) => {
    const sql = query.manuscript_id
      ? "SELECT * FROM chapters WHERE manuscript_id = ? ORDER BY manuscript_id, position"
      : "SELECT * FROM chapters ORDER BY manuscript_id, position";
    const chapters = (query.manuscript_id ? db.query(sql).all(query.manuscript_id) : db.query(sql).all()) as Array<Record<string, unknown>>;
    return chapters.map((chapter) => ({ ...chapter, word_count: wordCount(chapter.content_html as string) }));
  }, { query: t.Object({ manuscript_id: t.Optional(t.String()) }) })
  .get("/api/chapters/:id", ({ params, set }) => {
    const chapter = db.query("SELECT * FROM chapters WHERE id = ?").get(params.id) as Record<string, unknown> | null;
    if (!chapter) { set.status = 404; return { error: "Chapter not found" }; }
    const notes = db.query("SELECT id, body, position, created_at, updated_at FROM chapter_notes WHERE chapter_id = ? ORDER BY position").all(params.id);
    return { ...chapter, word_count: wordCount(chapter.content_html as string), notes };
  })
  .post("/api/manuscripts/:id/chapters", ({ params, body, set }) => {
    if (!db.query("SELECT id FROM manuscripts WHERE id = ?").get(params.id)) { set.status = 404; return { error: "Manuscript not found" }; }
    const id = crypto.randomUUID();
    const position = (db.query("SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM chapters WHERE manuscript_id = ?").get(params.id) as { next_position: number }).next_position;
    const contentJson = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
    db.query("INSERT INTO chapters (id, manuscript_id, title, position, content_json, content_html, status, word_goal) VALUES (?, ?, ?, ?, ?, '', 'draft', 2000)").run(id, params.id, body.title, position, contentJson);
    set.status = 201;
    return db.query("SELECT *, 0 AS word_count FROM chapters WHERE id = ?").get(id);
  }, { body: t.Object({ title: t.String({ minLength: 1, maxLength: 150 }) }) })
  .patch("/api/chapters/:id", ({ params, body, set }) => {
    if (!db.query("SELECT id FROM chapters WHERE id = ?").get(params.id)) { set.status = 404; return { error: "Chapter not found" }; }
    db.query("UPDATE chapters SET title = COALESCE(?, title), content_json = COALESCE(?, content_json), content_html = COALESCE(?, content_html), status = COALESCE(?, status), word_goal = COALESCE(?, word_goal), font_size = COALESCE(?, font_size), font_family = COALESCE(?, font_family), updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(body.title ?? null, body.content_json ?? null, body.content_html ?? null, body.status ?? null, body.word_goal ?? null, body.font_size ?? null, body.font_family ?? null, params.id);
    return db.query("SELECT * FROM chapters WHERE id = ?").get(params.id);
  }, { body: t.Object({ title: t.Optional(t.String({ minLength: 1 })), content_json: t.Optional(t.String()), content_html: t.Optional(t.String()), status: t.Optional(t.Union([t.Literal("idea"), t.Literal("draft"), t.Literal("revised"), t.Literal("complete")])), word_goal: t.Optional(t.Number({ minimum: 0 })), font_size: t.Optional(t.Number({ minimum: 12, maximum: 28 })), font_family: t.Optional(t.Union([t.Literal("Playfair Display"), t.Literal("Lora"), t.Literal("Merriweather"), t.Literal("Libre Baskerville"), t.Literal("Source Serif 4")])) }) })
  .delete("/api/chapters/:id", ({ params, set }) => {
    const result = db.query("DELETE FROM chapters WHERE id = ?").run(params.id);
    if (!result.changes) { set.status = 404; return { error: "Chapter not found" }; }
    return { ok: true };
  })
  .post("/api/chapters/:id/notes", ({ params, body, set }) => {
    if (!db.query("SELECT id FROM chapters WHERE id = ?").get(params.id)) { set.status = 404; return { error: "Chapter not found" }; }
    const id = crypto.randomUUID();
    db.query("INSERT INTO chapter_notes (id, chapter_id, body, position) VALUES (?, ?, ?, COALESCE((SELECT MAX(position) + 1 FROM chapter_notes WHERE chapter_id = ?), 0))").run(id, params.id, body.body, params.id);
    return db.query("SELECT * FROM chapter_notes WHERE id = ?").get(id);
  }, { body: t.Object({ body: t.String({ minLength: 1, maxLength: 5000 }) }) })
  .patch("/api/notes/:id", ({ params, body, set }) => {
    const result = db.query("UPDATE chapter_notes SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(body.body, params.id);
    if (!result.changes) { set.status = 404; return { error: "Note not found" }; }
    return db.query("SELECT * FROM chapter_notes WHERE id = ?").get(params.id);
  }, { body: t.Object({ body: t.String({ minLength: 1, maxLength: 5000 }) }) })
  .delete("/api/notes/:id", ({ params, set }) => {
    const result = db.query("DELETE FROM chapter_notes WHERE id = ?").run(params.id);
    if (!result.changes) { set.status = 404; return { error: "Note not found" }; }
    return { ok: true };
  });

if (staticDir) {
  app.get("/*", ({ request, set }) => {
    const filePath = resolveStaticPath(new URL(request.url).pathname);
    if (!filePath) {
      set.status = 404;
      return "Not found";
    }
    return Bun.file(filePath);
  });
}

app.listen(3001);

console.log(`Writerly API running at ${app.server?.url}`);
