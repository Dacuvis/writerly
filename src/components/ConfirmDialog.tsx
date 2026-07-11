import { useState } from "react";
import DialogShell from "./DialogShell";

type Props = { title: string; description: string; confirmLabel: string; onClose: () => void; onConfirm: () => Promise<void> };
export default function ConfirmDialog({ title, description, confirmLabel, onClose, onConfirm }: Props) {
  const [saving, setSaving] = useState(false);
  async function confirm() { setSaving(true); try { await onConfirm(); onClose(); } finally { setSaving(false); } }
  return <DialogShell title={title} onClose={onClose}><div className="confirm-copy">{description}</div><footer><button className="dialog-cancel" onClick={onClose}>Cancel</button><button className="dialog-danger" onClick={() => void confirm()} disabled={saving}>{saving ? "Deleting…" : confirmLabel}</button></footer></DialogShell>;
}
