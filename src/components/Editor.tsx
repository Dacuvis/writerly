import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Mark } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_EDITOR_FONT, FONT_OPTIONS, fontCss, resolveFontValue } from "../lib/fonts";
import { apiUrl } from "../lib/api";

export type Chapter = {
  id: string;
  title: string;
  position: number;
  status: string;
  word_goal: number;
  font_size: number;
  font_family: string;
  content_json: string;
  content_html: string;
  word_count: number;
};
type Props = {
  chapter: Chapter;
  onSave: (
    id: string,
    json: string,
    html: string,
    fontSize: number,
    fontFamily: string,
  ) => Promise<void>;
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={active ? "tool active" : "tool"}
    >
      {children}
    </button>
  );
}

function FontFamilySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (font: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = resolveFontValue(value);
  const label =
    FONT_OPTIONS.find((font) => font.value === current)?.label ?? current;

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div
      className={`font-family-picker${open ? " open" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="font-family-trigger"
        aria-label="Font for selected text"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <strong style={{ fontFamily: fontCss(current) }}>{label}</strong>
        <i>▾</i>
      </button>
      {open && (
        <div className="font-family-menu" role="listbox" aria-label="Fonts">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              type="button"
              role="option"
              aria-selected={font.value === current}
              className={`font-family-option${font.value === current ? " active" : ""}`}
              style={{ fontFamily: font.css }}
              onClick={() => {
                onChange(font.value);
                setOpen(false);
              }}
            >
              {font.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
type Note = { id: string; body: string };

const FontFamily = Mark.create({
  name: "fontFamily",
  keepOnSplit: false,
  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.style.fontFamily || null;
          return raw ? resolveFontValue(raw) : null;
        },
        renderHTML: (attributes: { fontFamily?: string }) =>
          attributes.fontFamily
            ? { style: `font-family: ${fontCss(attributes.fontFamily)}` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*='font-family']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

const FontSize = Mark.create({
  name: "fontSize",
  keepOnSplit: false,
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attributes: { fontSize?: string }) =>
          attributes.fontSize
            ? { style: `font-size: ${attributes.fontSize}` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*='font-size']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

function ChapterNotes({ chapterId }: { chapterId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDraft("");
    void fetch(apiUrl(`/api/chapters/${chapterId}`))
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { notes?: Note[] }) => {
        if (active) setNotes(data.notes ?? []);
      })
      .catch(() => {
        if (active) setNotes([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [chapterId]);

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSaving(true);
    try {
      const response = await fetch(apiUrl(`/api/chapters/${chapterId}/notes`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error();
      const note = (await response.json()) as Note;
      setNotes((items) => [...items, note]);
      setDraft("");
    } finally {
      setSaving(false);
    }
  }
  async function saveNote(id: string, body: string) {
    const value = body.trim();
    if (!value) return;
    const response = await fetch(apiUrl(`/api/notes/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: value }),
    });
    if (response.ok) {
      const saved = (await response.json()) as Note;
      setNotes((items) => items.map((note) => (note.id === id ? saved : note)));
    }
  }
  async function deleteNote(id: string) {
    const response = await fetch(apiUrl(`/api/notes/${id}`), { method: "DELETE" });
    if (response.ok)
      setNotes((items) => items.filter((note) => note.id !== id));
  }

  return (
    <section className="notes">
      <div className="notes-heading">
        <span>✦</span>
        <strong>Notes</strong>
        <small>{notes.length}</small>
      </div>
      {loading ? (
        <p>Loading notes…</p>
      ) : (
        <>
          <div className="note-list">
            {notes.map((note) => (
              <div className="note-card" key={note.id}>
                <textarea
                  aria-label="Chapter note"
                  defaultValue={note.body}
                  onBlur={(event) => void saveNote(note.id, event.target.value)}
                  rows={3}
                />
                <button
                  type="button"
                  aria-label="Delete note"
                  title="Delete note"
                  onClick={() => void deleteNote(note.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {!notes.length && (
            <p>
              Keep plot ideas, research, or reminders for this chapter here.
            </p>
          )}
          <form className="note-form" onSubmit={(event) => void addNote(event)}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a note…"
              rows={3}
              maxLength={5000}
            />
            <button type="submit" disabled={!draft.trim() || saving}>
              {saving ? "Saving…" : "Add note"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default function Editor({ chapter, onSave }: Props) {
  const chapterRef = useRef(chapter);
  const saveRef = useRef(onSave);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [words, setWords] = useState(chapter.word_count);
  const [, setSelectionVersion] = useState(0);
  chapterRef.current = chapter;
  saveRef.current = onSave;
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Begin writing…" }),
    ],
    content: chapter.content_html,
    editorProps: { attributes: { class: "prose-editor", spellcheck: "false" } },
    onUpdate: ({ editor: instance }) => {
      setWords(countWords(instance.getText()));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(
        () =>
          void saveRef.current(
            chapterRef.current.id,
            JSON.stringify(instance.getJSON()),
            instance.getHTML(),
            chapterRef.current.font_size || 17,
            chapterRef.current.font_family || DEFAULT_EDITOR_FONT,
          ),
        700,
      );
    },
    onSelectionUpdate: () => setSelectionVersion((version) => version + 1),
  });

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!editor) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    editor.commands.setContent(chapter.content_html, { emitUpdate: false });
    setWords(countWords(editor.getText()));
  }, [chapter.id, editor]);

  if (!editor) return null;
  const goal = chapter.word_goal || 2000;
  const headingLevel =
    [1, 2, 3, 4, 5, 6].find((level) => editor.isActive("heading", { level })) ??
    0;
  const fontFamily = resolveFontValue(
    editor.getAttributes("fontFamily").fontFamily || DEFAULT_EDITOR_FONT,
  );
  const fontSize =
    Number.parseInt(editor.getAttributes("fontSize").fontSize, 10) || 17;
  function setTextSize(size: number) {
    editor
      .chain()
      .focus()
      .setMark("fontSize", { fontSize: `${size}px` })
      .run();
  }
  function setTextFont(family: string) {
    editor.chain().focus().setMark("fontFamily", { fontFamily: family }).run();
  }
  return (
    <div className="editor-layout">
      <div className="writing-area">
        <div className="toolbar">
          <select
            value={headingLevel ? `Heading ${headingLevel}` : "Body"}
            onChange={(e) => {
              const level = Number(e.target.value.replace("Heading ", ""));
              level
                ? editor
                    .chain()
                    .focus()
                    .setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                    .run()
                : editor.chain().focus().setParagraph().run();
            }}
          >
            <option>Body</option>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <option key={level}>Heading {level}</option>
            ))}
          </select>
          <FontFamilySelect value={fontFamily} onChange={setTextFont} />
          <select
            className="font-size-select"
            aria-label="Font size for selected text"
            value={fontSize}
            onChange={(event) => setTextSize(Number(event.target.value))}
          >
            {[14, 16, 17, 18, 20, 22].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <span className="toolbar-line" />
          <ToolButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <b>B</b>
          </ToolButton>
          <ToolButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <i>I</i>
          </ToolButton>
          <ToolButton
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <u>U</u>
          </ToolButton>
          <span className="toolbar-line" />
          <ToolButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            ≡
          </ToolButton>
          <ToolButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            ❝
          </ToolButton>
          <span className="toolbar-line" />
          {(
            [
              { align: "left", icon: "L", label: "Align left" },
              { align: "center", icon: "C", label: "Align center" },
              { align: "right", icon: "R", label: "Align right" },
              { align: "justify", icon: "J", label: "Justify" },
            ] as const
          ).map(({ align, icon, label }) => (
            <button
              key={align}
              aria-label={label}
              title={label}
              className={`align-btn${editor.isActive({ textAlign: align }) ? " active" : ""}`}
              onClick={() => editor.chain().focus().setTextAlign(align).run()}
            >
              {icon}
            </button>
          ))}
          <span className="shortcut">⌘ /</span>
        </div>
        <article className="page">
          <EditorContent editor={editor} />
        </article>
        <footer className="editor-footer">
          <span>{words.toLocaleString()} words</span>
          <span>•</span>
          <span>{Math.max(1, Math.ceil(words / 220))} min read</span>
          <span className="footer-hint">Autosaves after you pause typing</span>
        </footer>
      </div>
      <aside className="insights">
        <div className="insights-title">
          <span>CHAPTER DETAILS</span>
          <button>⌃</button>
        </div>
        <label>STATUS</label>
        <button className="status">
          <span></span> {chapter.status} <b>⌄</b>
        </button>
        <label>CHAPTER GOAL</label>
        <div className="goal">
          <div>
            <strong>{words.toLocaleString()}</strong>
            <span>/ {goal.toLocaleString()} words</span>
          </div>
          <div className="progress">
            <i style={{ width: `${Math.min((words / goal) * 100, 100)}%` }} />
          </div>
          <small>
            {Math.max(0, goal - words).toLocaleString()} words to go
          </small>
        </div>
        <ChapterNotes chapterId={chapter.id} />
      </aside>
    </div>
  );
}
