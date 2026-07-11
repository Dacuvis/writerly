import { useState } from "react";
import DialogShell from "./DialogShell";

type Props = { mode: "create" | "rename"; initialTitle?: string; onClose: () => void; onSubmit: (title: string) => Promise<void> };

export default function ChapterDialog({ mode, initialTitle = "", onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(initialTitle); const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!title.trim()) return; setSaving(true); try { await onSubmit(title.trim()); onClose(); } finally { setSaving(false); } }
  return <DialogShell title={mode === "create" ? "New chapter" : "Rename chapter"} description={mode === "create" ? "Give this chapter a working title. You can change it anytime." : undefined} onClose={onClose}><form onSubmit={submit}><label className="dialog-field">Chapter title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chapter title" maxLength={150} /></label><footer><button type="button" className="dialog-cancel" onClick={onClose}>Cancel</button><button className="dialog-submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create chapter" : "Save name"}</button></footer></form></DialogShell>;
}
