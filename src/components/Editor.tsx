import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState, type CSSProperties } from "react";

export type Chapter = { id: string; title: string; position: number; status: string; word_goal: number; font_size: number; content_json: string; content_html: string; word_count: number };
type Props = { chapter: Chapter; onSave: (id: string, json: string, html: string, fontSize: number) => Promise<void> };

function countWords(text: string) { return text.trim().split(/\s+/).filter(Boolean).length; }
function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) { return <button aria-label={label} title={label} onClick={onClick} className={active ? "tool active" : "tool"}>{children}</button>; }

export default function Editor({ chapter, onSave }: Props) {
  const chapterRef = useRef(chapter);
  const saveRef = useRef(onSave);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [words, setWords] = useState(chapter.word_count);
  const [fontSize, setFontSize] = useState(chapter.font_size || 17);
  chapterRef.current = chapter; saveRef.current = onSave;
  const editor = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: "Begin writing…" })],
    content: chapter.content_html,
    editorProps: { attributes: { class: "prose-editor", spellcheck: "false" } },
    onUpdate: ({ editor: instance }) => {
      setWords(countWords(instance.getText()));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void saveRef.current(chapterRef.current.id, JSON.stringify(instance.getJSON()), instance.getHTML(), fontSize), 700);
    },
  });

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  useEffect(() => {
    if (!editor) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    editor.commands.setContent(chapter.content_html, { emitUpdate: false });
    setWords(countWords(editor.getText()));
    setFontSize(chapter.font_size || 17);
  }, [chapter.id, editor]);

  if (!editor) return null;
  const goal = chapter.word_goal || 2000;
  const headingLevel = [1, 2, 3, 4, 5, 6].find((level) => editor.isActive("heading", { level })) ?? 0;
  function setTextSize(size: number) { setFontSize(size); void saveRef.current(chapter.id, JSON.stringify(editor.getJSON()), editor.getHTML(), size); }
  return <div className="editor-layout"><div className="writing-area"><div className="toolbar"><select value={headingLevel ? `Heading ${headingLevel}` : "Body"} onChange={(e) => { const level = Number(e.target.value.replace("Heading ", "")); level ? editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run() : editor.chain().focus().setParagraph().run(); }}><option>Body</option>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level}>Heading {level}</option>)}</select><select className="font-size-select" aria-label="Font size" value={fontSize} onChange={(event) => setTextSize(Number(event.target.value))}>{[14, 16, 17, 18, 20, 22].map((size) => <option key={size} value={size}>{size}px</option>)}</select><span className="toolbar-line" /><ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolButton><ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolButton><ToolButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolButton><span className="toolbar-line" /><ToolButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>≡</ToolButton><ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolButton><span className="shortcut">⌘ /</span></div><article className="page" style={{ "--editor-font-size": `${fontSize}px` } as CSSProperties}><EditorContent editor={editor} /></article><footer className="editor-footer"><span>{words.toLocaleString()} words</span><span>•</span><span>{Math.max(1, Math.ceil(words / 220))} min read</span><span className="footer-hint">Autosaves after you pause typing</span></footer></div><aside className="insights"><div className="insights-title"><span>CHAPTER DETAILS</span><button>⌃</button></div><label>STATUS</label><button className="status"><span></span> {chapter.status} <b>⌄</b></button><label>CHAPTER GOAL</label><div className="goal"><div><strong>{words.toLocaleString()}</strong><span>/ {goal.toLocaleString()} words</span></div><div className="progress"><i style={{ width: `${Math.min((words / goal) * 100, 100)}%` }} /></div><small>{Math.max(0, goal - words).toLocaleString()} words to go</small></div><div className="notes"><div><span>✦</span><strong>Notes</strong><button>+</button></div><p>Notes are ready to be connected to the chapter API.</p></div></aside></div>;
}
