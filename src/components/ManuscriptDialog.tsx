import { useState } from "react";
import DialogShell from "./DialogShell";

type Props = { mode: "create" | "rename"; initialTitle?: string; initialDescription?: string; onClose: () => void; onSubmit: (data: { title: string; description: string }) => Promise<void> };

export default function ManuscriptDialog({ mode, initialTitle = "", initialDescription = "", onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(initialTitle); const [description, setDescription] = useState(initialDescription); const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!title.trim()) return; setSaving(true); try { await onSubmit({ title: title.trim(), description: description.trim() }); onClose(); } finally { setSaving(false); } }
  return <DialogShell title={mode === "create" ? "New manuscript" : "Edit manuscript"} description={mode === "create" ? "Start a fresh story, novel, or collection." : undefined} onClose={onClose}><form onSubmit={submit}><label className="dialog-field">Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled manuscript" maxLength={150} /></label><label className="dialog-field">Description <em>optional</em><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short note about this manuscript" maxLength={500} rows={3} /></label><footer><button type="button" className="dialog-cancel" onClick={onClose}>Cancel</button><button className="dialog-submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create manuscript" : "Save changes"}</button></footer></form></DialogShell>;
}
