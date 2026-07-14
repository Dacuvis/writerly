import { Database } from "bun:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";

function getBackendRoot() {
  if (process.env.WRITERLY_SCHEMA_PATH) {
    return dirname(process.env.WRITERLY_SCHEMA_PATH);
  }
  if (basename(process.execPath) === "writerly-api.exe") {
    return dirname(process.execPath);
  }
  return import.meta.dir;
}

const dataDir = process.env.WRITERLY_DATA_DIR ?? join(getBackendRoot(), "data");
const databasePath = join(dataDir, "writerly.sqlite");
const schemaPath = process.env.WRITERLY_SCHEMA_PATH ?? join(getBackendRoot(), "schema.sql");

mkdirSync(dataDir, { recursive: true });

export const db = new Database(databasePath, { create: true });
db.exec(readFileSync(schemaPath, "utf8"));
// Existing local databases need this migration because CREATE TABLE IF NOT EXISTS
// does not add columns to an already-created table.
const chapterColumns = db.query("PRAGMA table_info(chapters)").all() as Array<{ name: string }>;
if (!chapterColumns.some((column) => column.name === "font_size")) {
  db.exec("ALTER TABLE chapters ADD COLUMN font_size INTEGER NOT NULL DEFAULT 17 CHECK (font_size BETWEEN 12 AND 28)");
}
if (!chapterColumns.some((column) => column.name === "font_family")) {
  db.exec("ALTER TABLE chapters ADD COLUMN font_family TEXT NOT NULL DEFAULT 'Playfair Display'");
}

const chapterContent = JSON.stringify({ type: "doc", content: [{ type: "paragraph", attrs: { class: "eyebrow" }, content: [{ type: "text", text: "CHAPTER ONE" }] }, { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "The Last Summer" }] }, { type: "paragraph", content: [{ type: "text", text: "There are summers that stretch out before you like an open road, all heat-haze and possibility. And then there are the ones you spend years trying to find your way back to." }] }] });
const chapterHtml = "<p class=\"eyebrow\">CHAPTER ONE</p><h1>The Last Summer</h1><p>There are summers that stretch out before you like an open road, all heat-haze and possibility. And then there are the ones you spend years trying to find your way back to.</p>";

// Seed once so the frontend has a complete manuscript to render immediately.
if (!db.query("SELECT id FROM users WHERE id = ?").get("user_elena")) {
  db.transaction(() => {
    db.query("INSERT INTO users (id, name, email, avatar_initials) VALUES (?, ?, ?, ?)").run("user_elena", "Elena Morales", "elena@example.com", "EM");
    db.query("INSERT INTO manuscripts (id, owner_id, title, description, cover_color) VALUES (?, ?, ?, ?, ?)").run("manuscript_leave", "user_elena", "the things we leave", "A literary novel", "#c9d75e");
    const insertChapter = db.query("INSERT INTO chapters (id, manuscript_id, title, position, content_json, content_html, status, word_goal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insertChapter.run("chapter_01", "manuscript_leave", "The Last Summer", 1, chapterContent, chapterHtml, "draft", 2000);
    insertChapter.run("chapter_02", "manuscript_leave", "A Note in the Margins", 2, JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }), "", "idea", 2000);
    insertChapter.run("chapter_03", "manuscript_leave", "After the Storm", 3, JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }), "", "idea", 2000);
    db.query("INSERT INTO chapter_notes (id, chapter_id, body) VALUES (?, ?, ?)").run("note_01", "chapter_01", "Jot down ideas, research, or reminders for this chapter.");
    db.query("INSERT INTO manuscript_collaborators (manuscript_id, user_id, role) VALUES (?, ?, ?)").run("manuscript_leave", "user_elena", "owner");
  })();
}

export function wordCount(html: string) {
  const plainText = html.replace(/<[^>]*>/g, " ").trim();
  return plainText ? plainText.split(/\s+/).length : 0;
}
